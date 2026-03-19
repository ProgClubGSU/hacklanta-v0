import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import get_session
from app.domains.users.models import User
from app.utils.email import render_template, send_email

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main() -> None:
    logger.info("Starting accept-all email blast...")

    # We use our async generator from get_session()
    async for session in get_session():
        # Query all users who haven't been sent the email yet
        query = select(User).where(User.acceptance_sent_at.is_(None))
        result = await session.execute(query)
        users = result.scalars().all()

        if not users:
            logger.info("No users found missing the acceptance email. Exiting.")
            return

        logger.info(f"Found {len(users)} users to email.")

        success_count = 0
        error_count = 0

        for user in users:
            # Use first_name if available, otherwise just email
            name = user.first_name or user.email
            subject, html_body = render_template("application_accepted", name=name)

            try:
                # Send the email via Resend
                send_email(to=user.email, subject=subject, html_body=html_body)

                # Mark as sent
                user.acceptance_sent_at = datetime.now(timezone.utc)
                await session.commit()
                success_count += 1

                logger.info(f"Successfully emailed and updated user: {user.email}")
            except Exception as e:
                logger.error(f"Failed to email user {user.email}: {e}")
                await session.rollback()
                error_count += 1

        logger.info("--- Email Blast Summary ---")
        logger.info(f"Total processed: {len(users)}")
        logger.info(f"Successes: {success_count}")
        logger.info(f"Errors: {error_count}")
        break  # get_session() is an infinite generator unless broken

if __name__ == "__main__":
    asyncio.run(main())
