-- BookCircle Initial Migration

CREATE TABLE IF NOT EXISTS "Users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "phone" text,
  "school" text,
  "grade" text,
  "address" text,
  "avatar" text,
  "bio" text,
  "reputation_score" decimal(3,2) NOT NULL DEFAULT 5.00,
  "total_sales" integer NOT NULL DEFAULT 0,
  "total_purchases" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Books" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL REFERENCES "Users"("id"),
  "title" text NOT NULL,
  "author" text NOT NULL,
  "isbn" text,
  "publisher" text,
  "publish_year" integer,
  "category" text NOT NULL DEFAULT 'other',
  "condition" text NOT NULL DEFAULT 'good',
  "price" decimal(10,2) NOT NULL,
  "original_price" decimal(10,2),
  "description" text,
  "images" text[] DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'available',
  "view_count" integer NOT NULL DEFAULT 0,
  "favorite_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "book_id" uuid NOT NULL REFERENCES "Books"("id"),
  "buyer_id" uuid NOT NULL REFERENCES "Users"("id"),
  "seller_id" uuid NOT NULL REFERENCES "Users"("id"),
  "price" decimal(10,2) NOT NULL,
  "status" text NOT NULL DEFAULT 'pending_payment',
  "shipping_address" text,
  "tracking_number" text,
  "payment_method" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "book_id" uuid NOT NULL REFERENCES "Books"("id"),
  "buyer_id" uuid NOT NULL REFERENCES "Users"("id"),
  "seller_id" uuid NOT NULL REFERENCES "Users"("id"),
  "last_message" text,
  "last_message_at" timestamp,
  "buyer_unread" integer NOT NULL DEFAULT 0,
  "seller_unread" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "Conversations"("id"),
  "sender_id" uuid NOT NULL REFERENCES "Users"("id"),
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "Orders"("id"),
  "reviewer_id" uuid NOT NULL REFERENCES "Users"("id"),
  "reviewee_id" uuid NOT NULL REFERENCES "Users"("id"),
  "rating" integer NOT NULL,
  "comment" text NOT NULL,
  "role" text NOT NULL DEFAULT 'buyer',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "Users"("id"),
  "book_id" uuid NOT NULL REFERENCES "Books"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("user_id", "book_id")
);

CREATE TABLE IF NOT EXISTS "Reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporter_id" uuid NOT NULL REFERENCES "Users"("id"),
  "target_type" text NOT NULL,
  "target_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_books_seller_id" ON "Books"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_books_category" ON "Books"("category");
CREATE INDEX IF NOT EXISTS "idx_books_status" ON "Books"("status");
CREATE INDEX IF NOT EXISTS "idx_books_created_at" ON "Books"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_buyer_id" ON "Orders"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_seller_id" ON "Orders"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "Messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "Favorites"("user_id");
