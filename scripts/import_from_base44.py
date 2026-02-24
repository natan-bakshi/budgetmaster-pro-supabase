#!/usr/bin/env python3
"""
Base44 → Supabase Import Script
================================
מייבא: Categories, CategoryInstances, MonthlyHistory, Transactions

הרצה:
  pip install supabase
  python import_from_base44.py

וודא שארבעת קבצי ה-CSV נמצאים באותה תיקייה כמו הסקריפט.
"""

import csv
import uuid
import sys
import os
from datetime import datetime, timezone

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase library not installed.")
    print("Run: pip install supabase")
    sys.exit(1)


# ============================================================
# הגדרות - מלא את הערכים הנכונים לפני הרצה
# ============================================================

SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"

# Service Role Key (לא anon key!) - מ-Supabase > Settings > API
SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"

# ה-UUID של ה-household שלך ב-Supabase
# מצא בעזרת: SELECT id FROM households LIMIT 1;
NEW_HOUSEHOLD_ID = "YOUR_SUPABASE_HOUSEHOLD_UUID"

# ה-UUID של החשבון הבנקאי הראשי שלך ב-Supabase
# מצא בעזרת: SELECT id, name FROM accounts;
# אם אין לך חשבון עדיין - צור אחד דרך האפליקציה ואז הכנס את ה-UUID כאן
NEW_ACCOUNT_ID = "YOUR_SUPABASE_ACCOUNT_UUID"

# ============================================================

OLD_HOUSEHOLD_ID = "6847fb32e5efa3c07cf153cf"
OLD_ACCOUNT_ID = "6847fd2e2daa32d500f8b146"

CSV_DIR = os.path.dirname(os.path.abspath(__file__))


def read_csv(filename):
    path = os.path.join(CSV_DIR, filename)
    if not os.path.exists(path):
        # חפש גם בתיקייה הנוכחית
        path = filename
    if not os.path.exists(path):
        print(f"ERROR: File not found: {filename}")
        sys.exit(1)
    with open(path, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def safe_float(val, default=0.0):
    try:
        return float(val) if val and val.strip() else default
    except (ValueError, AttributeError):
        return default


def safe_int(val, default=0):
    try:
        return int(val) if val and val.strip() else default
    except (ValueError, AttributeError):
        return default


def safe_bool(val):
    return str(val).lower() in ('true', '1', 'yes')


def safe_str(val):
    return val.strip() if val and val.strip() else None


def validate_config():
    errors = []
    if "YOUR_PROJECT_ID" in SUPABASE_URL:
        errors.append("SUPABASE_URL - לא עודכן")
    if "YOUR_SERVICE_ROLE_KEY" in SUPABASE_SERVICE_KEY:
        errors.append("SUPABASE_SERVICE_KEY - לא עודכן")
    if "YOUR_SUPABASE_HOUSEHOLD_UUID" in NEW_HOUSEHOLD_ID:
        errors.append("NEW_HOUSEHOLD_ID - לא עודכן")
    if "YOUR_SUPABASE_ACCOUNT_UUID" in NEW_ACCOUNT_ID:
        errors.append("NEW_ACCOUNT_ID - לא עודכן")
    if errors:
        print("\n❌ יש להגדיר את הערכים הבאים בסקריפט:")
        for e in errors:
            print(f"   • {e}")
        print("\nפתח את הסקריפט ומלא את הערכים בחלק ה-'הגדרות' בראש הקובץ.")
        sys.exit(1)


def main():
    validate_config()

    print("\n🔌 Connecting to Supabase...")
    sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Connected\n")

    # --------------------------------------------------------
    # שלב 1: Categories
    # --------------------------------------------------------
    print("📂 Importing Categories...")
    category_rows = read_csv("Category_export.csv")
    category_id_map = {}  # base44_id -> new_uuid

    for row in category_rows:
        old_id = row["id"]
        account_id = NEW_ACCOUNT_ID if row.get("accountId") == OLD_ACCOUNT_ID else safe_str(row.get("accountId"))

        record = {
            "name": row["name"],
            "type": row["type"],
            "default_amount": safe_float(row.get("defaultAmount")),
            "account_id": account_id,
            "execution_date": safe_str(row.get("executionDate")),
            "show_notes": safe_bool(row.get("showNotes")),
            "order": safe_int(row.get("order")),
            "household_id": NEW_HOUSEHOLD_ID,
        }

        # בדוק אם כבר קיים
        existing = sb.table("categories") \
            .select("id") \
            .eq("household_id", NEW_HOUSEHOLD_ID) \
            .eq("name", record["name"]) \
            .execute()

        if existing.data:
            new_id = existing.data[0]["id"]
            category_id_map[old_id] = new_id
            print(f"  ⏭  {row['name']} (קיים → {new_id[:8]}...)")
        else:
            result = sb.table("categories").insert(record).execute()
            if result.data:
                new_id = result.data[0]["id"]
                category_id_map[old_id] = new_id
                print(f"  ✅ {row['name']} → {new_id[:8]}...")
            else:
                print(f"  ❌ נכשל לייבא: {row['name']}")

    print(f"\n✅ Categories: {len(category_id_map)} mapped\n")

    # --------------------------------------------------------
    # שלב 2: MonthlyHistory
    # --------------------------------------------------------
    print("📅 Importing MonthlyHistory...")
    history_rows = read_csv("MonthlyHistory_export.csv")
    history_count = 0

    for row in history_rows:
        # בדוק אם חודש זה כבר קיים
        existing = sb.table("monthly_history") \
            .select("id") \
            .eq("household_id", NEW_HOUSEHOLD_ID) \
            .eq("month", row["month"]) \
            .execute()

        if existing.data:
            print(f"  ⏭  {row['month']} (קיים)")
            continue

        record = {
            "month": row["month"],
            "total_income": safe_float(row["totalIncome"]),
            "total_expenses": safe_float(row["totalExpenses"]),
            "balance": safe_float(row["balance"]),
            "household_id": NEW_HOUSEHOLD_ID,
        }

        result = sb.table("monthly_history").insert(record).execute()
        if result.data:
            print(f"  ✅ {row['month']}")
            history_count += 1
        else:
            print(f"  ❌ נכשל: {row['month']}")

    print(f"\n✅ MonthlyHistory: {history_count} imported\n")

    # --------------------------------------------------------
    # שלב 3: CategoryInstances
    # --------------------------------------------------------
    print("📊 Importing CategoryInstances...")
    instance_rows = read_csv("CategoryInstance_export.csv")
    instance_count = 0
    instance_skipped = 0

    for row in instance_rows:
        old_cat_id = row["categoryId"]
        new_cat_id = category_id_map.get(old_cat_id)

        if not new_cat_id:
            instance_skipped += 1
            continue

        # בדוק אם כבר קיים
        existing = sb.table("category_instances") \
            .select("id") \
            .eq("household_id", NEW_HOUSEHOLD_ID) \
            .eq("category_id", new_cat_id) \
            .eq("month", row["month"]) \
            .execute()

        if existing.data:
            instance_skipped += 1
            continue

        record = {
            "household_id": NEW_HOUSEHOLD_ID,
            "current_amount": safe_float(row["currentAmount"]),
            "notes": row.get("notes", "") or "",
            "month": row["month"],
            "category_id": new_cat_id,
        }

        result = sb.table("category_instances").insert(record).execute()
        if result.data:
            instance_count += 1
            if instance_count % 10 == 0:
                print(f"  ... {instance_count} instances imported")

    print(f"\n✅ CategoryInstances: {instance_count} imported, {instance_skipped} skipped\n")

    # --------------------------------------------------------
    # שלב 4: Transactions
    # --------------------------------------------------------
    print("💳 Importing Transactions...")
    transaction_rows = read_csv("Transaction_export.csv")
    tx_count = 0
    tx_skipped = 0
    BATCH_SIZE = 50
    batch = []

    for row in transaction_rows:
        old_cat_id = row.get("categoryId", "")
        new_cat_id = category_id_map.get(old_cat_id)

        if not new_cat_id:
            tx_skipped += 1
            continue

        account_id = NEW_ACCOUNT_ID if row.get("accountId") == OLD_ACCOUNT_ID else safe_str(row.get("accountId"))

        record = {
            "date": row["date"],
            "household_id": NEW_HOUSEHOLD_ID,
            "account_id": account_id,
            "amount": safe_float(row["amount"]),
            "notes": row.get("notes", "") or "",
            "is_executed": safe_bool(row.get("isExecuted")),
            "scheduled_date": safe_str(row.get("scheduledDate")),
            "type": row["type"],
            "category_id": new_cat_id,
            "is_automatic": safe_bool(row.get("isAutomatic")),
        }

        batch.append(record)

        if len(batch) >= BATCH_SIZE:
            result = sb.table("transactions").insert(batch).execute()
            tx_count += len(batch)
            batch = []
            print(f"  ... {tx_count} transactions imported")

    # Insert remaining batch
    if batch:
        result = sb.table("transactions").insert(batch).execute()
        tx_count += len(batch)

    print(f"\n✅ Transactions: {tx_count} imported, {tx_skipped} skipped\n")

    # --------------------------------------------------------
    # סיכום
    # --------------------------------------------------------
    print("=" * 50)
    print("🎉 ייבוא הושלם בהצלחה!")
    print("=" * 50)
    print(f"  Categories:        {len(category_id_map)}")
    print(f"  MonthlyHistory:    {history_count}")
    print(f"  CategoryInstances: {instance_count}")
    print(f"  Transactions:      {tx_count}")
    print()
    print("עכשיו פתח את האפליקציה - כל הדאטה צריכה להיות שם!")


if __name__ == "__main__":
    main()
