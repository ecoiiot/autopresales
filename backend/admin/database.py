"""
数据库配置和连接
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 数据库连接配置（从环境变量读取，如果没有则使用默认值）
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "wangdefu")

# 构建数据库 URL
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 连接前检查连接是否有效
    pool_recycle=3600,   # 连接回收时间（秒）
    echo=False            # 是否打印 SQL 语句（生产环境设为 False）
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库（创建表）"""
    try:
        # 导入所有模型，确保表被注册
        from .models import ToolAccess, ToolStatistic, ToolVideo, AdminUser
        Base.metadata.create_all(bind=engine)
        
        # 创建默认管理员账号（如果不存在）
        db = SessionLocal()
        try:
            from werkzeug.security import generate_password_hash
            
            # 检查是否已有管理员
            admin = db.query(AdminUser).filter(AdminUser.username == 'admin').first()
            if not admin:
                # 创建默认管理员：用户名 admin，密码 admin123
                default_password = generate_password_hash('admin123')
                admin = AdminUser(
                    username='admin',
                    password=default_password,
                    is_active=1
                )
                db.add(admin)
                db.commit()
                print("=" * 50)
                print("默认管理员账号已创建")
                print("用户名: admin")
                print("密码: admin123")
                print("=" * 50)
        except Exception as e:
            print(f"创建默认管理员账号失败: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"数据库初始化失败: {e}")

