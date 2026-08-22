from sqlalchemy.orm import declarative_base

Base = declarative_base()

from backend.models.user import User
from backend.models.city import City
from backend.models.activity import Activity
from backend.models.trip import Trip
from backend.models.section import Section
from backend.models.section_activity import SectionActivity
from backend.models.expense import Expense
from backend.models.community_post import CommunityPost
from backend.models.post_comment import PostComment
from backend.models.post_like import PostLike
