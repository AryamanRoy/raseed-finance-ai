from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.responses import FileResponse, RedirectResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv
import pandas as pd
import subprocess
import os
import uuid
import shutil
from datetime import datetime, timedelta
from types import SimpleNamespace

import httpx
from jose import JWTError, jwt
from sqlalchemy import Column, DateTime, String, Boolean, create_engine, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = 60 * 24 * 7  # 7 days
ALLOW_NO_DB_MODE = os.getenv("ALLOW_NO_DB_MODE", "false").lower() in {"1", "true", "yes", "on"}

engine = None
SessionLocal = None
if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL, future=True,pool_pre_ping=True,
    pool_recycle=300)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception:
        # If DB deps aren't installed yet (or URL invalid), keep the app running
        # and only fail on endpoints that require the DB.
        engine = None
        SessionLocal = None
Base = declarative_base()


class User(Base):
    """
    Mirror of existing Neon table:
    public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        profile_picture_url TEXT,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        last_login TIMESTAMPTZ
    )
    """

    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    google_id = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    role = Column(String, nullable=False, server_default=text("'user'"))
    is_active = Column(Boolean, nullable=False, server_default=text("true"))
    is_verified = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    last_login = Column(DateTime(timezone=True), nullable=True)


def init_db() -> None:
    global engine, SessionLocal
    if engine is None:
        return
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as e:
        # In dev fallback mode we allow app startup without DB connectivity.
        if ALLOW_NO_DB_MODE:
            print(f"[WARN] Database init skipped (ALLOW_NO_DB_MODE=true): {e}")
            engine = None
            SessionLocal = None
            return
        raise


def get_db() -> Session | None:
    if SessionLocal is None:
        if ALLOW_NO_DB_MODE:
            yield None
            return
        raise HTTPException(status_code=500, detail="Database not configured. Set DATABASE_URL in .env.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_EXPIRES_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
    db: Session | None = Depends(get_db),
) -> User:
    """Dependency that validates JWT bearer token and returns the DB user."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        if ALLOW_NO_DB_MODE:
            return SimpleNamespace(id="dev-user", email="dev@local", role="user")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        if ALLOW_NO_DB_MODE:
            return SimpleNamespace(id="dev-user", email="dev@local", role="user")
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    if db is None:
        # Dev fallback: trust token payload when DB is unavailable.
        return SimpleNamespace(
            id=user_id,
            email=payload.get("email", "dev@local"),
            role=payload.get("role", "user"),
        )

    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


init_db()


app = FastAPI(title="Raseed Financial Advisor API")


def custom_openapi():
    """
    Attach a global HTTP Bearer (JWT) security scheme so Swagger shows
    the lock icon and an Authorize button for all endpoints.
    """
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        routes=app.routes,
        description=app.description,
    )

    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }

    # Apply BearerAuth to all operations by default (lock icon on every API)
    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Raseed Financial Advisor API is running", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "endpoints": ["/chat", "/api/categorize", "/auth/google/login", "/auth/google/callback"]}


@app.get("/auth/google/login")
async def google_login():
    if not GOOGLE_CLIENT_ID or not GOOGLE_OAUTH_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI.")

    scope = "openid email profile"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": scope,
        "access_type": "offline",
        "prompt": "consent",
    }
    from urllib.parse import urlencode

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)


@app.get("/auth/google/callback")
async def google_callback(code: str | None = None, error: str | None = None, db: Session | None = Depends(get_db)):
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code from Google.")
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_OAUTH_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Google OAuth not configured on server.")

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange code: {token_resp.text}")
        token_data = token_resp.json()

        id_token = token_data.get("id_token")
        access_token = token_data.get("access_token")
        if not id_token and not access_token:
            raise HTTPException(status_code=400, detail="No id_token or access_token returned from Google.")

        # Prefer userinfo endpoint
        userinfo = None
        if access_token:
            ui_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if ui_resp.status_code == 200:
                userinfo = ui_resp.json()

    if not userinfo and id_token:
        try:
            # NOTE: We do not verify against Google's certs here; for production, add audience and issuer checks.
            userinfo = jwt.get_unverified_claims(id_token)  # type: ignore[attr-defined]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode id_token: {e}")

    if not userinfo:
        raise HTTPException(status_code=400, detail="Could not obtain user info from Google.")

    sub = userinfo.get("sub")
    email = userinfo.get("email")
    name = userinfo.get("name")
    picture = userinfo.get("picture")
    if not sub or not email:
        raise HTTPException(status_code=400, detail="Google user info missing required fields.")

    if db is None and ALLOW_NO_DB_MODE:
        access_token = create_access_token(
            {
                "sub": sub,
                "email": email,
                "role": "user",
            }
        )
    else:
        # Upsert user
        stmt = select(User).where(User.google_id == sub)
        user = db.execute(stmt).scalar_one_or_none()
        now = datetime.utcnow()
        if user is None:
            user = User(
                google_id=sub,
                email=email,
                full_name=name,
                profile_picture_url=picture,
                created_at=now,
                last_login=now,
            )
            db.add(user)
        else:
            user.email = email
            user.full_name = name
            user.profile_picture_url = picture
            user.last_login = now
        db.commit()
        db.refresh(user)

        access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
            }
        )

    # For SPA, easiest is to return a small HTML page that posts the token to the opener
    html = f"""
<!DOCTYPE html>
<html>
  <body>
    <script>
      (function() {{
        const token = {access_token!r};
        if (window.opener && !window.opener.closed) {{
          // Send token back to the SPA; frontend will validate origin.
          window.opener.postMessage({{ type: 'oauth-success', token }}, '*');
        }}
        window.close();
      }})();
    </script>
  </body>
</html>
"""
    return HTMLResponse(content=html, media_type="text/html")

@app.post("/api/categorize")
async def categorize(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    file_id = str(uuid.uuid4())
    input_path = f"uploads/{file_id}_input.csv"
    output_path = f"uploads/{file_id}_output.csv"
    
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save uploaded file temporarily
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Run your existing LLM script
        cmd = ["python", "main.py", input_path]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        # Check if the default output file was created
        default_output = "Bank_transaction_categorized.csv"
        if os.path.exists(default_output):
            # Move it to our unique output path
            shutil.move(default_output, output_path)
        elif not os.path.exists(output_path):
            # If main.py didn't create the file, try to read it from the same directory
            raise HTTPException(status_code=500, detail=f"Categorization failed. Error: {result.stderr}")

        # Return categorized CSV file
        return FileResponse(
            output_path, 
            media_type="text/csv", 
            filename="Bank_transaction_categorized.csv",
            headers={"Content-Disposition": "attachment; filename=Bank_transaction_categorized.csv"}
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Categorization failed: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up input file
        if os.path.exists(input_path):
            os.remove(input_path)
        # Note: output file will be cleaned up after download or can be cleaned up periodically


from dotenv import load_dotenv
from geminichatbot.app.chat_brain import (
    build_context_block, craft_parts, enforce_note, update_memory_summary
)
from geminichatbot.app.data_model import (
    load_expense_csv, normalize_expenses, summarize
)
from pydantic import BaseModel
load_dotenv()

try:
    from google import genai as new_genai
    HAS_NEW_GENAI = True
except Exception:
    new_genai = None
    HAS_NEW_GENAI = False
    import google.generativeai as legacy_genai


def get_gemini_client():
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not found. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.",
        )
    if HAS_NEW_GENAI:
        return new_genai.Client(api_key=api_key)

    # Fallback for older SDK installs
    legacy_genai.configure(api_key=api_key)
    return None

SYSTEM = (
    "You are a friendly personal finance copilot for India-focused users.\n"
    "The user uploads a CSV that contains only OUTGOING transactions (expenses).\n"
    "Keep responses short, structured, and practical.\n"
    "Strictly avoid naming specific investment products or giving buy/sell calls.\n"
    "Always end with this NOTE:\n"
    "Educational only. Not financial advice. Please research before investing."
)


class ChatRequest(BaseModel):
    message: str
    file_id: str = "latest"  # file_id to identify the categorized CSV file
    history: list | None = None
    profile: dict | None = None
    income: float | None = None
    memory: str | None = ""


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/login")
async def manual_login(payload: LoginRequest, db: Session | None = Depends(get_db)):
    # For now we only support email-based login for users that already
    # exist (e.g., created via Google OAuth). Password is accepted but
    # not validated because no password hash is stored in the schema.
    if db is None and ALLOW_NO_DB_MODE:
        access_token = create_access_token(
            {
                "sub": payload.email,
                "email": payload.email,
                "role": "user",
            }
        )
    else:
        stmt = select(User).where(User.email == payload.email)
        user = db.execute(stmt).scalar_one_or_none()
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found. Please sign in with Google first.",
            )

        access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
            }
        )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/chat")
async def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
):
    try:
        # Validate API key and initialize Gemini client
        client = get_gemini_client()
        
        # Handle "latest" file_id by finding the most recent output file
        if req.file_id == "latest":
            uploads_dir = "uploads"
            if not os.path.exists(uploads_dir):
                raise HTTPException(
                    status_code=404, 
                    detail="No categorized files found. Please upload and categorize a CSV file first using the CSV upload feature."
                )
            
            # Find all output CSV files
            try:
                output_files = [f for f in os.listdir(uploads_dir) if f.endswith("_output.csv")]
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error reading uploads directory: {str(e)}"
                )
            
            if not output_files:
                raise HTTPException(
                    status_code=404, 
                    detail="No categorized files found. Please upload and categorize a CSV file first using the CSV upload feature."
                )
            
            # Get the most recently modified file
            file_paths = [os.path.join(uploads_dir, f) for f in output_files]
            file_path = max(file_paths, key=os.path.getmtime)
            print(f"Using latest file: {file_path}")  # Debug log
        else:
            file_path = f"uploads/{req.file_id}_output.csv"
            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404, 
                    detail=f"Categorized file not found for file_id: {req.file_id}. Please upload and categorize a CSV file first."
                )

        # Load and summarize
        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()
            df = load_expense_csv(file_bytes)
            if df.empty:
                raise HTTPException(status_code=400, detail="The CSV file is empty or could not be parsed.")
            dfn, cols = normalize_expenses(df)
            profile = summarize(dfn, cols)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing CSV file: {str(e)}")

        # Build context + query
        ctx_block = build_context_block(profile, req.income)
        memory = update_memory_summary(req.memory or "", req.history or [], max_chars=900)

        parts = craft_parts(
            history=req.history or [],
            ctx_block=ctx_block,
            query=req.message,
            mem_summary=memory
        )

        # Generate response from Gemini using cheaper flash model
        try:
            model_name = "gemini-2.5-flash"
            if HAS_NEW_GENAI:
                resp = client.models.generate_content(
                    model=model_name,
                    contents=parts,
                    config={"system_instruction": SYSTEM},
                )
            else:
                model = legacy_genai.GenerativeModel(model_name=model_name, system_instruction=SYSTEM)
                resp = model.generate_content(parts)
            
            # Extract text from response
            answer = ""
            if hasattr(resp, 'text') and resp.text:
                answer = resp.text
            elif hasattr(resp, 'candidates') and resp.candidates:
                # Try to get text from candidates
                candidate = resp.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    answer = "".join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
            
            if not answer or not answer.strip():
                # Check if response was blocked
                if hasattr(resp, 'prompt_feedback'):
                    block_reason = getattr(resp.prompt_feedback, 'block_reason', None)
                    if block_reason:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Response was blocked: {block_reason}. Please try rephrasing your question."
                        )
                raise HTTPException(
                    status_code=500, 
                    detail="Gemini API returned an empty response. Please check your API key and try again."
                )
            
            answer = enforce_note(answer.strip())
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e)
            if "API key" in error_msg or "authentication" in error_msg.lower() or "403" in error_msg:
                raise HTTPException(
                    status_code=401, 
                    detail=f"Gemini API authentication failed: {error_msg}. Please check your API key."
                )
            if "429" in error_msg or "quota" in error_msg.lower():
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API quota exceeded. Please try again later."
                )
            raise HTTPException(
                status_code=500, 
                detail=f"Error calling Gemini API: {error_msg}"
            )

        return {"response": answer, "memory": memory}

    except HTTPException:
        # Re-raise HTTP exceptions (like 404) as-is
        raise
    except Exception as e:
        # Log full error for debugging, but return user-friendly message
        import traceback
        error_trace = traceback.format_exc()
        print(f"Unexpected error in chat endpoint: {error_trace}")  # Log to console
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}. Please check server logs for details."
        )
