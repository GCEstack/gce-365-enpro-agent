"""
Stub CISM file generator.

This module was missing from the repo and is required for server.py to import.
The real implementation should generate the P21 CISM import CSV format.
For now, it writes a minimal CSV so the application can boot and process POs.
"""

import csv
import os
from datetime import datetime


def generate_cism_file(header, lines, output_dir):
    """Generate a minimal CISM CSV file and return its path."""
    os.makedirs(output_dir, exist_ok=True)
    po_no = getattr(header, "po_no", "unknown") or "unknown"
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"cism_{po_no}_{ts}.csv"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "po_no", "order_date", "supplier_name", "ship2_name",
            "line_no", "item_id", "qty_ordered", "unit_price"
        ])
        for i, line in enumerate(lines or [], start=1):
            writer.writerow([
                po_no,
                getattr(header, "order_date", ""),
                getattr(header, "supplier_name", ""),
                getattr(header, "ship2_name", ""),
                i,
                getattr(line, "item_id_p21", "") or getattr(line, "supplier_part_id", ""),
                getattr(line, "qty_ordered", 0),
                getattr(line, "unit_price", 0),
            ])

    return filepath
