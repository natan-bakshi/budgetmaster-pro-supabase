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
import sys
import os

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase library not installed.")
    print("Run: pip install supabase")
    sys.exit(1)


# ============================================================
# הגדרות - מלא רק את שני הערכים הבאים
# ============================================================

# Supabase Project URL → Supabase > Settings > API > Project URL
SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"

# Service Role Key → Supabase > Settings > API > service_role (לא anon!)
SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"

# כבר מוכנס - אל תשנה
NEW_HOUSEHOLD_ID = "7a6f6a91-bdaa-4f8f-bcd6-d9aaf3487c3c"

# ============================================================

OLD_ACCOUNT_ID = "6847fd2e2daa32d500f8b146"

CSV_DIR = os.path.dirname(os.path.abspath(__file__))


def read_csv(filename):
    # חפש בתיקיית הסקריפט ובתיקייה הנוכחית
    for path in [os.path.join(CSV_DIR, filename), filename]:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return list(csv.DictReader(f))
    print(f"ERROR: File not found: {filename}")
    print(f"\nוודא שהקבצים הבאים נמצאים באותה תיקייה כמו הסקריפט:")
    print("  Category_export.csv")
    print("  CategoryInstance_export.csv")
    print("  MonthlyHistory_export.csv")
    print("  Transaction_export.csv")
    sys.exit(1)


def safe_float(val, default=0.0):
    try:
        return float(val) if val and str(val).strip() else default
    except (ValueError, AttributeError):
        return default


def safe_int(val, default=0):
    try:
        return int(val) if val and str(val).strip() else default
    except (ValueError, AttributeError):
        return default


def safe_bool(val):
    return str(val).lower() in ('true', '1', 'yes')


def safe_str(val):
    s = str(val).strip() if val else ""
    return s if s else None


def validate_config():
    errors = []
    if "YOUR_PROJECT_ID" in SUPABASE_URL:
        errors.append("SUPABASE_URL")
    if "YOUR_SERVICE_ROLE_KEY" in SUPABASE_SERVICE_KEY:
        errors.append("SUPABASE_SERVICE_KEY")
    if errors:
        print("\n❌ יש למלא את הערכים הבאים בסקריפט:")
        for e in errors:
            print(f"   • {e}")
        sys.exit(1)


def get_account_id(sb):
    """חיפש אוטומטי של ה-account הראשון ב-Supabase"""
    result = sb.table("accounts") \
        .select("id, name") \
        .eq("household_id", NEW_HOUSEHOLD_ID) \
        .execute()

    if result.data:
        acc = result.data[0]
        print(f"  ✅ Account found: '{acc['name']}' ({acc['id'][:8]}...)")
        return acc["id"]
    else:
        print("  ⚠️  לא נמצא חשבון ב-Supabase.")
        print("  צור חשבון דרך האפליקציה (דף 'מבט לחשבון') ואחר כך הרץ שוב.")
        print("  לעת זאת הקטגוריות והיסטוריה ייבאו עם account_id=null")
        return None


def main():
    validate_config()

    print("\n🔌 Connecting to Supabase...")
    sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Connected")

    print("\n🔍 Detecting account ID...")
    NEW_ACCOUNT_ID = get_account_id(sb)

    # --------------------------------------------------------
    # שלב 1: Categories
    # --------------------------------------------------------
    print("\n📂 Importing Categories...")
    category_rows = read_csv("Category_export.csv")
    category_id_map = {}  # base44_id → new_supabase_uuid

    for row in category_rows:
        old_id = row["id"]
        account_id = NEW_ACCOUNT_ID if row.get("accountId") == OLD_ACCOUNT_ID else safe_str(row.get("accountId")) or NEW_ACCOUNT_ID

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

        existing = sb.table("categories") \
            .select("id") \
            .eq("household_id", NEW_HOUSEHOLD_ID) \
            .eq("name", record["name"]) \
            .execute()

        if existing.data:
            new_id = existing.data[0]["id"]
            category_id_map[old_id] = new_id
            print(f"  ⏭  {row['name']} (קיים)")
        else:
            result = sb.table("categories").insert(record).execute()
            if result.data:
                new_id = result.data[0]["id"]
                category_id_map[old_id] = new_id
                print(f"  ✅ {row['name']}")
            else:
                print(f"  ❌ {row['name']}: {result}")

    print(f"\n  ✓ {len(category_id_map)} categories ready")

    # --------------------------------------------------------
    # שלב 2: MonthlyHistory
    # --------------------------------------------------------
    print("\n📅 Importing MonthlyHistory...")
    history_rows = read_csv("MonthlyHistory_export.csv")
    history_count = 0

    for row in history_rows:
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
            print(f"  ❌ {row['month']}: {result}")

    print(f"  ✓ {history_count} months imported")

    # --------------------------------------------------------
    # שלב 3: CategoryInstances
    # --------------------------------------------------------
    print("\n📊 Importing CategoryInstances...")
    instance_rows = read_csv("CategoryInstance_export.csv")
    instance_count = 0
    instance_skipped = 0

    for row in instance_rows:
        new_cat_id = category_id_map.get(row["categoryId"])
        if not new_cat_id:
            instance_skipped += 1
            continue

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
            if instance_count % 20 == 0:
                print(f"  ... {instance_count} instances")

    print(f"  ✓ {instance_count} instances imported, {instance_skipped} skipped")

    # --------------------------------------------------------
    # שלב 4: Transactions (batches of 50)
    # --------------------------------------------------------
    print("\n💳 Importing Transactions...")
    transaction_rows = read_csv("Transaction_export.csv")
    tx_count = 0
    tx_skipped = 0
    batch = []
    BATCH_SIZE = 50

    for row in transaction_rows:
        new_cat_id = category_id_map.get(row.get("categoryId", ""))
        if not new_cat_id:
            tx_skipped += 1
            continue

        account_id = NEW_ACCOUNT_ID if row.get("accountId") == OLD_ACCOUNT_ID else safe_str(row.get("accountId")) or NEW_ACCOUNT_ID

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
            sb.table("transactions").insert(batch).execute()
            tx_count += len(batch)
            batch = []
            print(f"  ... {tx_count} transactions")

    if batch:
        sb.table("transactions").insert(batch).execute()
        tx_count += len(batch)

    print(f"  ✓ {tx_count} transactions imported, {tx_skipped} skipped")

    # --------------------------------------------------------
    # סיכום
    # --------------------------------------------------------
    print("\n" + "=" * 50)
    print("🎉 ייבוא הושלם!")
    print("=" * 50)
    print(f"  • Categories:        {len(category_id_map)}")
    print(f"  • MonthlyHistory:    {history_count}")
    print(f"  • CategoryInstances: {instance_count}")
    print(f"  • Transactions:      {tx_count}")
    print("\nעכשיו פתח את האפליקציה - כל הדאטה צריכה להיות שם!")


if __name__ == "__main__":
    main()
