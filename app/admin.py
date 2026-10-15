from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from app.config import settings
from app.database import engine
from app.models import Category, Faq, Lead, Portfolio, Service


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


class PortfolioAdmin(ModelView, model=Portfolio):
    name = "Кейс"
    name_plural = "Портфолио"
    icon = "fa-solid fa-briefcase"
    column_list = [Portfolio.id, Portfolio.slug, Portfolio.title, Portfolio.tags, Portfolio.sort_order]
    column_searchable_list = [Portfolio.title, Portfolio.slug]
    column_sortable_list = [Portfolio.sort_order, Portfolio.id]
    form_columns = [
        Portfolio.slug, Portfolio.title, Portfolio.description,
        Portfolio.image_url, Portfolio.site_url, Portfolio.tags, Portfolio.sort_order,
    ]


class ServiceAdmin(ModelView, model=Service):
    name = "Услуга"
    name_plural = "Услуги"
    icon = "fa-solid fa-list"
    column_list = [Service.id, Service.title, Service.price_full, Service.unit, Service.sort_order]
    column_searchable_list = [Service.title]
    column_sortable_list = [Service.sort_order, Service.id]


class CategoryAdmin(ModelView, model=Category):
    name = "Категория"
    name_plural = "Категории"
    icon = "fa-solid fa-tags"
    column_list = [Category.id, Category.name, Category.sort_order]
    column_sortable_list = [Category.sort_order, Category.id]


class FaqAdmin(ModelView, model=Faq):
    name = "FAQ"
    name_plural = "FAQ"
    icon = "fa-solid fa-circle-question"
    column_list = [Faq.id, Faq.question, Faq.sort_order]
    column_sortable_list = [Faq.sort_order, Faq.id]


class LeadAdmin(ModelView, model=Lead):
    name = "Заявка"
    name_plural = "Заявки"
    icon = "fa-solid fa-envelope"
    column_list = [Lead.id, Lead.name, Lead.phone, Lead.question, Lead.source, Lead.created_at]
    column_searchable_list = [Lead.name, Lead.phone]
    column_sortable_list = [Lead.created_at, Lead.id]
    can_create = False
    can_edit = False


def create_admin(app) -> Admin:
    auth = AdminAuth(secret_key=settings.admin_secret_key)
    admin = Admin(app=app, engine=engine, authentication_backend=auth, title="Велкод — Admin")
    admin.add_view(PortfolioAdmin)
    admin.add_view(ServiceAdmin)
    admin.add_view(CategoryAdmin)
    admin.add_view(FaqAdmin)
    admin.add_view(LeadAdmin)
    return admin
