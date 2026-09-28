import os
import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "manganese_operations.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes local SQLite database with MOIL operational tables."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table 1: Mine Sites Master
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mine_sites (
        site_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        area_sqkm REAL NOT NULL,
        active_benches INTEGER NOT NULL,
        annual_target_tonnes REAL NOT NULL,
        ytd_production_tonnes REAL NOT NULL,
        operational_status TEXT NOT NULL
    );
    """)

    # Table 2: Shift Telemetry Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shift_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        shift_name TEXT NOT NULL,
        mine_site TEXT NOT NULL,
        shift_target_tonnes REAL NOT NULL,
        actual_extraction_tonnes REAL NOT NULL,
        shortfall_tonnes REAL NOT NULL,
        shortfall_percentage REAL NOT NULL,
        active_excavators INTEGER NOT NULL,
        active_dumpers INTEGER NOT NULL,
        blasting_scheduled_today INTEGER NOT NULL,
        rainfall_forecast_mm REAL NOT NULL,
        machinery_breakdown_hours REAL NOT NULL,
        bench_moisture_level REAL NOT NULL,
        haul_distance_km REAL NOT NULL,
        risk_level TEXT NOT NULL
    );
    """)

    # Table 3: Spectral Mineral Reserves
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mineral_reserves (
        zone_id TEXT PRIMARY KEY,
        mine_site TEXT NOT NULL,
        zone_name TEXT NOT NULL,
        mn_content_percent REAL NOT NULL,
        fe_content_percent REAL NOT NULL,
        depth_meters REAL NOT NULL,
        stripping_ratio REAL NOT NULL,
        estimated_reserves_tonnes REAL NOT NULL,
        mmpi_score REAL NOT NULL,
        confidence REAL NOT NULL,
        anomaly_tag TEXT NOT NULL
    );
    """)

    # Populate initial seed data if empty
    cursor.execute("SELECT COUNT(*) FROM mine_sites;")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO mine_sites VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, [
            ("balaghat-01", "MOIL Balaghat Mine", "Madhya Pradesh", 21.8042, 80.1814, 14.8, 6, 850000.0, 680450.0, "ACTIVE_OPERATIONAL"),
            ("dongri-02", "MOIL Dongri Buzurg Mine", "Maharashtra", 21.5453, 79.7021, 9.2, 4, 420000.0, 335000.0, "ACTIVE_OPERATIONAL"),
            ("chikla-03", "MOIL Chikla Mine", "Maharashtra", 21.5541, 79.7524, 6.5, 3, 280000.0, 215000.0, "ACTIVE_OPERATIONAL")
        ])

        # Populate historical shift telemetry
        np.random.seed(42)
        start_date = datetime.now() - timedelta(days=60)
        shifts = ["Shift A (06:00-14:00)", "Shift B (14:00-22:00)", "Shift C (22:00-06:00)"]
        sites = ["Balaghat", "Dongri Buzurg", "Chikla"]

        telemetry_rows = []
        for d in range(60):
            curr_date = (start_date + timedelta(days=d)).strftime("%Y-%m-%d")
            is_rainy = np.random.rand() < 0.3
            base_rain = np.random.uniform(12.0, 45.0) if is_rainy else np.random.uniform(0.0, 3.0)

            for shift in shifts:
                site = np.random.choice(sites, p=[0.6, 0.25, 0.15])
                target = float(np.random.choice([1000.0, 1200.0, 1400.0]))
                rain = round(max(0.0, base_rain + np.random.normal(0, 2.0)), 1)
                excavators = int(np.random.randint(5, 12))
                dumpers = int(np.random.randint(14, 28))
                breakdown = round(float(np.random.exponential(scale=1.0)) if np.random.rand() < 0.35 else 0.0, 1)
                blasting = 1 if (shift == "Shift A (06:00-14:00)" and rain < 15.0 and np.random.rand() < 0.7) else 0
                bench_moisture = round(min(80.0, 12.0 + (rain * 1.5) + np.random.normal(0, 2.0)), 1)
                haul_dist = round(float(np.random.uniform(2.5, 5.0)), 2)

                actual = target - ((rain / 50.0) * 0.4 * target) - ((breakdown / 8.0) * 0.3 * target) + (100.0 if blasting else -30.0) + np.random.normal(0, 25.0)
                actual = max(200.0, min(actual, target * 1.1))
                shortfall = max(0.0, target - actual)
                shortfall_pct = (shortfall / target) * 100.0

                risk = "CRITICAL" if (shortfall_pct > 25.0 or rain >= 25.0) else ("MODERATE" if shortfall_pct > 10.0 else "OPTIMAL")

                telemetry_rows.append((
                    curr_date, shift, site, round(target, 1), round(actual, 1),
                    round(shortfall, 1), round(shortfall_pct, 2), excavators, dumpers,
                    blasting, rain, breakdown, bench_moisture, haul_dist, risk
                ))

        cursor.executemany("""
        INSERT INTO shift_telemetry (
            date, shift_name, mine_site, shift_target_tonnes, actual_extraction_tonnes,
            shortfall_tonnes, shortfall_percentage, active_excavators, active_dumpers,
            blasting_scheduled_today, rainfall_forecast_mm, machinery_breakdown_hours,
            bench_moisture_level, haul_distance_km, risk_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, telemetry_rows)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS benches (
        bench_id TEXT PRIMARY KEY,
        mine_site TEXT NOT NULL,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        max_cap REAL NOT NULL,
        rain_sensitivity REAL NOT NULL,
        haul_km REAL NOT NULL,
        bench_kind TEXT NOT NULL,
        status TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS compliance_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        mine_site TEXT NOT NULL,
        shift_name TEXT NOT NULL,
        rule_code TEXT NOT NULL,
        measured_value REAL NOT NULL,
        threshold REAL NOT NULL,
        decision TEXT NOT NULL,
        reason TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shift_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        mine_site TEXT NOT NULL,
        shift_name TEXT NOT NULL,
        shift_target_tonnes REAL NOT NULL,
        predicted_extraction_tonnes REAL NOT NULL,
        shortfall_tonnes REAL NOT NULL,
        tonnage_recovered REAL NOT NULL,
        net_financial_value_inr REAL NOT NULL,
        dgms_safety_status TEXT NOT NULL,
        directives_json TEXT NOT NULL,
        actual_extraction_tonnes REAL,
        rainfall_forecast_mm REAL,
        machinery_breakdown_hours REAL,
        bench_moisture_level REAL,
        haul_distance_km REAL,
        active_excavators INTEGER,
        active_dumpers INTEGER,
        blasting_scheduled_today INTEGER
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    cursor.execute("SELECT COUNT(*) FROM benches;")
    if cursor.fetchone()[0] == 0:
        templates = [
            ("PitA_Bench3", "Open Pit A Bench 3", 0.004, 0.003, 500, 0.9, 4.2, "OPEN_PIT"),
            ("PitB_OreFace", "Open Pit B High-Grade Ore Face", -0.003, 0.005, 750, 0.2, 2.8, "OPEN_PIT"),
            ("UG_ShaftRamp", "Underground Shaft Ramp Level 4", 0.002, -0.004, 450, 0.05, 1.5, "UNDERGROUND"),
            ("Stockpile3", "Stockpile 3 Blending Pit", -0.005, -0.002, 600, 0.1, 2.1, "STOCKPILE"),
        ]
        bench_rows = []
        for site, (lat, lng) in MINE_COORDS.items():
            for bench_id, name, dlat, dlng, cap, rain_s, haul, kind in templates:
                bench_rows.append((
                    f"{site}-{bench_id}", site, name,
                    round(lat + dlat, 6), round(lng + dlng, 6),
                    cap, rain_s, haul, kind, "ACTIVE"
                ))
        cursor.executemany("""
        INSERT INTO benches (
            bench_id, mine_site, name, lat, lng, max_cap, rain_sensitivity,
            haul_km, bench_kind, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, bench_rows)

    conn.commit()
    conn.close()

MINE_COORDS = {
    "Balaghat": (21.8042, 80.1814),
    "Dongri Buzurg": (21.5453, 79.7021),
    "Chikla": (21.5541, 79.7524),
}

def resolve_mine_site(mine_site: str) -> str:
    key = (mine_site or "Balaghat").lower()
    for name in MINE_COORDS:
        if name.lower() in key or key in name.lower():
            return name
    return mine_site or "Balaghat"

def list_benches(mine_site: str) -> List[Dict[str, Any]]:
    site = resolve_mine_site(mine_site)
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM benches WHERE mine_site = ?;", (site,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def set_bench_status(mine_site: str, halted_ids: List[str]) -> None:
    site = resolve_mine_site(mine_site)
    conn = get_db_connection()
    conn.execute("UPDATE benches SET status = 'ACTIVE' WHERE mine_site = ?;", (site,))
    for bench_id in halted_ids:
        conn.execute("UPDATE benches SET status = 'HALTED' WHERE bench_id = ?;", (bench_id,))
    conn.commit()
    conn.close()

def company_summary() -> Dict[str, Any]:
    conn = get_db_connection()
    sites = conn.execute("SELECT * FROM mine_sites;").fetchall()
    alerts = conn.execute(
        "SELECT COUNT(*) FROM compliance_alerts WHERE decision = 'HALT' AND created_at >= date('now', '-1 day');"
    ).fetchone()[0]
    latest = conn.execute("""
        SELECT active_excavators, active_dumpers FROM shift_telemetry
        WHERE id IN (SELECT MAX(id) FROM shift_telemetry GROUP BY mine_site);
    """).fetchall()
    conn.close()
    return {
        "sites": sites,
        "overall_target_tonnes": sum(r["annual_target_tonnes"] for r in sites),
        "overall_ytd_production_tonnes": sum(r["ytd_production_tonnes"] for r in sites),
        "dgms_active_alerts_count": int(alerts or 0),
        "active_excavators_total": int(sum(r["active_excavators"] for r in latest)),
        "active_dumpers_total": int(sum(r["active_dumpers"] for r in latest)),
    }

def log_compliance(mine_site: str, shift_name: str, rule_code: str, measured: float, threshold: float, decision: str, reason: str) -> None:
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO compliance_alerts (
            created_at, mine_site, shift_name, rule_code, measured_value, threshold, decision, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (datetime.now().isoformat(), resolve_mine_site(mine_site), shift_name, rule_code, measured, threshold, decision, reason))
    conn.commit()
    conn.close()

def list_compliance(mine_site: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if mine_site:
        rows = conn.execute(
            "SELECT * FROM compliance_alerts WHERE mine_site = ? ORDER BY id DESC LIMIT ?;",
            (resolve_mine_site(mine_site), limit)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM compliance_alerts ORDER BY id DESC LIMIT ?;", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_shift_plan(record: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cur = conn.execute("""
        INSERT INTO shift_plans (
            created_at, mine_site, shift_name, shift_target_tonnes, predicted_extraction_tonnes,
            shortfall_tonnes, tonnage_recovered, net_financial_value_inr, dgms_safety_status,
            directives_json, rainfall_forecast_mm, machinery_breakdown_hours, bench_moisture_level,
            haul_distance_km, active_excavators, active_dumpers, blasting_scheduled_today
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        datetime.now().isoformat(), resolve_mine_site(record["mine_site"]), record["shift_name"],
        record["shift_target_tonnes"], record["predicted_extraction_tonnes"], record["shortfall_tonnes"],
        record["tonnage_recovered"], record["net_financial_value_inr"], record["dgms_safety_status"],
        record["directives_json"], record.get("rainfall_forecast_mm"), record.get("machinery_breakdown_hours"),
        record.get("bench_moisture_level"), record.get("haul_distance_km"),
        record.get("active_excavators"), record.get("active_dumpers"), record.get("blasting_scheduled_today")
    ))
    conn.commit()
    plan_id = cur.lastrowid
    conn.close()
    return int(plan_id)

def list_shift_plans(mine_site: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if mine_site:
        rows = conn.execute(
            "SELECT * FROM shift_plans WHERE mine_site = ? ORDER BY id DESC LIMIT ?;",
            (resolve_mine_site(mine_site), limit)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM shift_plans ORDER BY id DESC LIMIT ?;", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def record_shift_actual(plan_id: int, actual_tonnes: float) -> Dict[str, Any]:
    conn = get_db_connection()
    plan = conn.execute("SELECT * FROM shift_plans WHERE id = ?;", (plan_id,)).fetchone()
    if plan is None:
        conn.close()
        raise ValueError("Shift plan not found")
    shortfall = max(0.0, plan["shift_target_tonnes"] - actual_tonnes)
    shortfall_pct = (shortfall / max(plan["shift_target_tonnes"], 1.0)) * 100.0
    risk = "CRITICAL" if shortfall_pct > 25 else ("MODERATE" if shortfall_pct > 10 else "OPTIMAL")
    conn.execute("UPDATE shift_plans SET actual_extraction_tonnes = ? WHERE id = ?;", (actual_tonnes, plan_id))
    conn.execute("""
        INSERT INTO shift_telemetry (
            date, shift_name, mine_site, shift_target_tonnes, actual_extraction_tonnes,
            shortfall_tonnes, shortfall_percentage, active_excavators, active_dumpers,
            blasting_scheduled_today, rainfall_forecast_mm, machinery_breakdown_hours,
            bench_moisture_level, haul_distance_km, risk_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        datetime.now().strftime("%Y-%m-%d"), plan["shift_name"], plan["mine_site"],
        plan["shift_target_tonnes"], actual_tonnes, round(shortfall, 1), round(shortfall_pct, 2),
        plan["active_excavators"] or 0, plan["active_dumpers"] or 0,
        plan["blasting_scheduled_today"] or 0, plan["rainfall_forecast_mm"] or 0,
        plan["machinery_breakdown_hours"] or 0, plan["bench_moisture_level"] or 0,
        plan["haul_distance_km"] or 0, risk
    ))
    conn.commit()
    updated = dict(conn.execute("SELECT * FROM shift_plans WHERE id = ?;", (plan_id,)).fetchone())
    conn.close()
    return updated

def training_frame():
    conn = get_db_connection()
    df = pd.read_sql_query("""
        SELECT shift_target_tonnes, active_excavators, active_dumpers, blasting_scheduled_today,
               rainfall_forecast_mm, machinery_breakdown_hours, bench_moisture_level,
               haul_distance_km, actual_extraction_tonnes
        FROM shift_telemetry
        WHERE actual_extraction_tonnes IS NOT NULL;
    """, conn)
    conn.close()
    return df

def set_meta(key: str, value: str) -> None:
    conn = get_db_connection()
    conn.execute("INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;", (key, value))
    conn.commit()
    conn.close()

def get_meta(key: str, default: str = "") -> str:
    conn = get_db_connection()
    row = conn.execute("SELECT value FROM app_meta WHERE key = ?;", (key,)).fetchone()
    conn.close()
    return row["value"] if row else default

# Initialize on import
init_db()
