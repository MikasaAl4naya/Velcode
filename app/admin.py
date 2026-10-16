import re
from pathlib import Path
from uuid import uuid4

from markupsafe import Markup
from sqladmin import Admin, BaseView, ModelView, expose
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import HTMLResponse

from app.config import settings
from app.database import engine
from app.models import Portfolio, Service

UPLOADS_DIR = Path("uploads")

_TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
}


def _slugify(text: str) -> str:
    text = text.lower()
    result = ''.join(_TRANSLIT.get(c, c) for c in text)
    result = re.sub(r'[^a-z0-9]+', '-', result)
    return result.strip('-')


def _img_thumb(url: str | None) -> str:
    if not url:
        return '—'
    return Markup(f'<img src="{url}" style="height:40px;border-radius:4px">')


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        if (
            form.get("username") == settings.admin_username
            and form.get("password") == settings.admin_password
        ):
            request.session["authenticated"] = True
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return bool(request.session.get("authenticated"))


class UploadView(BaseView):
    name = "Загрузить изображение"
    icon = "fa-solid fa-upload"

    @expose("/upload", methods=["GET", "POST"])
    async def upload_page(self, request: Request) -> HTMLResponse:
        uploaded_url = None
        error = None

        if request.method == "POST":
            form = await request.form()
            file = form.get("file")
            if file and getattr(file, "filename", ""):
                content = await file.read()
                if content:
                    UPLOADS_DIR.mkdir(exist_ok=True)
                    suffix = Path(file.filename).suffix or ".png"
                    fname = f"{uuid4().hex}{suffix}"
                    (UPLOADS_DIR / fname).write_bytes(content)
                    uploaded_url = f"/uploads/{fname}"
                else:
                    error = "Файл пустой"
            else:
                error = "Выберите файл"

        result_block = ""
        if uploaded_url:
            result_block = f"""
            <div class="result">
                <strong>Готово! Скопируйте URL в поле формы:</strong>
                <input type="text" id="url-field" readonly value="{uploaded_url}" onclick="this.select()">
                <button onclick="copyUrl()" type="button" id="copy-btn">Копировать</button>
                <br>
                <img src="{uploaded_url}" class="preview" alt="preview">
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Загрузить изображение — Велкод Admin</title>
            <style>
                body {{ font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 0 20px; }}
                h1 {{ font-size: 22px; margin-bottom: 24px; }}
                .form-group {{ margin-bottom: 16px; }}
                input[type=file] {{ display: block; margin-bottom: 12px; }}
                button {{ padding: 10px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; }}
                .result {{ margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; }}
                #url-field {{ display: block; width: 100%; font-size: 14px; margin: 8px 0 10px; padding: 8px; border-radius: 4px; border: 1px solid #d1fae5; background: #fff; box-sizing: border-box; cursor: text; }}
                .preview {{ max-width: 100%; max-height: 200px; margin-top: 12px; border-radius: 6px; }}
                .error {{ margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; color: #dc2626; }}
                .back {{ display: inline-block; margin-bottom: 20px; color: #4f46e5; text-decoration: none; }}
            </style>
        </head>
        <body>
            <a href="/admin" class="back">← Назад в админку</a>
            <h1>Загрузить изображение</h1>
            <form method="post" enctype="multipart/form-data">
                <div class="form-group">
                    <input type="file" name="file" accept="image/*">
                </div>
                <button type="submit">Загрузить</button>
            </form>
            {"" if not error else f'<div class="error">{error}</div>'}
            {result_block}
            <script>
            function copyUrl() {{
                var field = document.getElementById('url-field');
                var btn = document.getElementById('copy-btn');
                field.select();
                field.setSelectionRange(0, 99999);
                if (navigator.clipboard && window.isSecureContext) {{
                    navigator.clipboard.writeText(field.value).then(function() {{
                        btn.textContent = 'Скопировано ✓';
                        setTimeout(function() {{ btn.textContent = 'Копировать'; }}, 2000);
                    }});
                }} else {{
                    try {{
                        document.execCommand('copy');
                        btn.textContent = 'Скопировано ✓';
                        setTimeout(function() {{ btn.textContent = 'Копировать'; }}, 2000);
                    }} catch(e) {{
                        btn.textContent = 'Выделите и скопируйте вручную (Ctrl+C)';
                    }}
                }}
            }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(html)


class PortfolioAdmin(ModelView, model=Portfolio):
    name = "Кейс"
    name_plural = "Портфолио"
    icon = "fa-solid fa-briefcase"

    column_list = [Portfolio.id, Portfolio.title, Portfolio.image_url, Portfolio.show_on_main, Portfolio.sort_order]
    column_formatters = {Portfolio.image_url: lambda m, a: _img_thumb(m.image_url)}
    column_searchable_list = [Portfolio.title, Portfolio.slug]
    column_sortable_list = [Portfolio.sort_order, Portfolio.id]

    form_columns = [
        Portfolio.slug,
        Portfolio.title,
        Portfolio.description,
        Portfolio.what_was_done,
        Portfolio.image_url,
        Portfolio.hero_image_url,
        Portfolio.site_url,
        Portfolio.tags,
        Portfolio.show_on_main,
        Portfolio.sort_order,
    ]
    column_labels = {
        "slug": "URL-слаг (авто из названия, если пусто)",
        "image_url": "Картинка кейса — карточка + браузер-мокап (URL из «Загрузить изображение»)",
        "hero_image_url": "Фото на ноутбуке / устройстве — только на странице кейса (URL из «Загрузить изображение»)",
        "site_url": "URL в строке браузер-мокапа (напр. trattoria.ru/)",
        "tags": "Теги (через запятую)",
        "what_was_done": "Что было сделано (абзацы через пустую строку)",
        "show_on_main": "Показывать на главной странице",
        "sort_order": "Порядок",
    }

    async def on_model_change(self, data: dict, model, is_created: bool, request: Request) -> None:
        if not str(data.get("slug") or "").strip() and data.get("title"):
            data["slug"] = _slugify(str(data["title"]))


class ServiceAdmin(ModelView, model=Service):
    name = "Услуга"
    name_plural = "Услуги"
    icon = "fa-solid fa-list"

    column_list = [Service.id, Service.title, Service.price_full, Service.is_featured, Service.sort_order]
    column_sortable_list = [Service.sort_order, Service.id]
    column_searchable_list = [Service.title]

    form_columns = [
        Service.title,
        Service.description,
        Service.price_full,
        Service.is_featured,
        Service.image_url,
        Service.sort_order,
    ]
    column_labels = {
        "title": "Название",
        "description": "Описание",
        "price_full": "Цена (₽)",
        "is_featured": "Фиолетовая карточка",
        "image_url": "Картинка (URL из «Загрузить изображение»)",
        "sort_order": "Порядок",
    }


def create_admin(app) -> Admin:
    auth = AdminAuth(secret_key=settings.admin_secret_key)
    admin = Admin(app=app, engine=engine, authentication_backend=auth, title="Велкод — Admin")
    admin.add_view(PortfolioAdmin)
    admin.add_view(ServiceAdmin)
    admin.add_base_view(UploadView)
    return admin
