from alembic import context
from app.database.base import Base
from app.models import *
from app.database.session import settings
config=context.config; config.set_main_option('sqlalchemy.url',settings.database_url); target_metadata=Base.metadata
def run_migrations_offline():
    context.configure(url=settings.database_url,target_metadata=target_metadata,literal_binds=True)
    with context.begin_transaction(): context.run_migrations()
def run_migrations_online():
    from app.database.session import engine as connectable
    with connectable.connect() as connection:
        context.configure(connection=connection,target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()
run_migrations_offline() if context.is_offline_mode() else run_migrations_online()
