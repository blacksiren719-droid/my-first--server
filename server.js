const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// 1. ตั้งค่าให้ Server อ่านข้อมูลที่ส่งมาจากฟอร์ม (HTML Form) ได้
app.use(express.urlencoded({ extended: true }));

// 2. ตั้งค่าเชื่อมต่อฐานข้อมูล PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------------------------------------------
// เส้นทางที่ 1: (GET /) เมื่อเปิดหน้าเว็บหลัก ให้แสดงฟอร์มและตารางข้อมูล
// ---------------------------------------------------------
app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    // ดึงข้อมูลทั้งหมด เรียงตาม ID
    const result = await client.query('SELECT * FROM students ORDER BY id ASC');
    client.release();

    const totalStudents = result.rows.length;

    // สร้างแถวตารางจากข้อมูลในฐานข้อมูล
    let rowsHtml = '';
    if (totalStudents === 0) {
      rowsHtml = `
        <tr class="empty-row">
          <td colspan="4">
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <p>ยังไม่มีข้อมูลนักศึกษาในระบบ</p>
            </div>
          </td>
        </tr>`;
    } else {
      result.rows.forEach(row => {
        const initial = (row.student_name || '?').trim().charAt(0).toUpperCase();
        rowsHtml += `
        <tr>
          <td><span class="pill">#${row.id}</span></td>
          <td><span class="mono">${row.student_id}</span></td>
          <td>
            <div class="student-cell">
              <span class="avatar">${initial}</span>
              <span>${row.student_name}</span>
            </div>
          </td>
          <td class="action-cell">
            <form action="/delete" method="POST" class="inline-form">
              <input type="hidden" name="id" value="${row.id}">
              <button type="submit" class="btn-delete" onclick="return confirm('ยืนยันการลบข้อมูลนี้?')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
                ลบ
              </button>
            </form>
          </td>
        </tr>`;
      });
    }

    const html = `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ระบบจัดการนักศึกษา</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f1f3f9;
    --surface: #ffffff;
    --surface-2: #f8f9fd;
    --border: #e5e8f0;
    --text: #1a1d29;
    --text-muted: #6b7280;
    --primary: #4f46e5;
    --primary-dark: #4338ca;
    --primary-light: #eef2ff;
    --danger: #ef4444;
    --danger-dark: #dc2626;
    --success: #10b981;
    --radius: 14px;
    --shadow: 0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04);
    --shadow-lg: 0 8px 24px rgba(16, 24, 40, 0.08);
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Noto Sans Thai', 'Inter', sans-serif;
    margin: 0;
    padding: 40px 20px;
    background: radial-gradient(circle at top left, #eef1fb, var(--bg) 60%);
    color: var(--text);
    min-height: 100vh;
  }

  .page {
    max-width: 880px;
    margin: 0 auto;
  }

  .top-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 28px;
  }

  .logo-badge {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary), #7c3aed);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 18px;
    box-shadow: var(--shadow-lg);
    flex-shrink: 0;
  }

  .top-bar h1 {
    font-size: 21px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .top-bar p {
    margin: 2px 0 0;
    font-size: 13.5px;
    color: var(--text-muted);
  }

  .stat-strip {
    margin-left: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-strip strong {
    color: var(--primary);
    font-size: 15px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 28px;
    margin-bottom: 24px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
  }

  .card-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--primary-light);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card-header h2 {
    font-size: 16.5px;
    font-weight: 700;
    margin: 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: end;
  }

  .field label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 7px;
  }

  .field input[type="text"] {
    width: 100%;
    padding: 11px 14px;
    font-size: 14.5px;
    font-family: inherit;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--surface-2);
    color: var(--text);
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }

  .field input[type="text"]:hover {
    border-color: #c7cce0;
  }

  .field input[type="text"]:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--surface);
    box-shadow: 0 0 0 4px var(--primary-light);
  }

  .field input::placeholder {
    color: #a3a8bd;
  }

  .form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    padding: 11px 22px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .btn-add:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.38);
  }

  .btn-add:active {
    transform: translateY(0);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    padding: 0 14px 12px;
    border-bottom: 1.5px solid var(--border);
  }

  tbody td {
    padding: 14px;
    border-bottom: 1px solid var(--border);
    font-size: 14.5px;
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover td {
    background: var(--surface-2);
  }

  .pill {
    display: inline-block;
    background: var(--primary-light);
    color: var(--primary-dark);
    font-size: 12.5px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
  }

  .mono {
    font-family: 'Inter', monospace;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .student-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: linear-gradient(135deg, #7c3aed, var(--primary));
    color: white;
    font-weight: 700;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .action-cell {
    text-align: right;
  }

  .inline-form {
    margin: 0;
    display: inline-block;
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #fef2f2;
    color: var(--danger-dark);
    font-size: 12.5px;
    font-weight: 700;
    font-family: inherit;
    padding: 7px 12px;
    border: 1px solid #fecaca;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .btn-delete:hover {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }

  .empty-state {
    text-align: center;
    padding: 46px 20px;
    color: var(--text-muted);
  }

  .empty-state svg {
    color: #cbd0e0;
    margin-bottom: 10px;
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
  }

  footer {
    text-align: center;
    font-size: 12.5px;
    color: #9aa0b4;
    padding: 8px 0 0;
  }

  @media (max-width: 600px) {
    body { padding: 20px 12px; }
    .card { padding: 20px; }
    .form-grid { grid-template-columns: 1fr; }
    .stat-strip { display: none; }
    thead th:nth-child(1), tbody td:nth-child(1) { display: none; }
  }
</style>
</head>
<body>
  <div class="page">

    <div class="top-bar">
      <div class="logo-badge">SIS</div>
      <div>
        <h1>ระบบจัดการนักศึกษา</h1>
        <p>Student Information System</p>
      </div>
      <div class="stat-strip">
        นักศึกษาทั้งหมด&nbsp;<strong>${totalStudents}</strong>&nbsp;คน
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <h2>เพิ่มข้อมูลนักศึกษาใหม่</h2>
      </div>

      <!-- ฟอร์มนี้จะส่งข้อมูลไปที่ /add ด้วยวิธี POST -->
      <form action="/add" method="POST" class="form-grid">
        <div class="field">
          <label for="student_id">รหัสนักศึกษา</label>
          <input type="text" id="student_id" name="student_id" placeholder="เช่น 69319011113" required>
        </div>
        <div class="field">
          <label for="student_name">ชื่อ-นามสกุล</label>
          <input type="text" id="student_name" name="student_name" placeholder="เช่น กุลธวัช แสงสุขวาว" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-add">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            บันทึกข้อมูล
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>
          </svg>
        </div>
        <h2>รายชื่อนักศึกษาในระบบ</h2>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>รหัสนักศึกษา</th>
            <th>ชื่อ-นามสกุล</th>
            <th style="text-align:right;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <footer>เชื่อมต่อฐานข้อมูล PostgreSQL แบบเรียลไทม์</footer>

  </div>
</body>
</html>
`;
    res.send(html);
  } catch (err) {
    res.send(renderError('ไม่สามารถโหลดข้อมูลได้', err.message));
  }
});

// ---------------------------------------------------------
// เส้นทางที่ 2: (POST /add) รับข้อมูลจากฟอร์มมาบันทึกลงฐานข้อมูล
// ---------------------------------------------------------
app.post('/add', async (req, res) => {
  // รับค่ามาจากช่อง input ที่ตั้งชื่อ name="student_id" และ name="student_name"
  const { student_id, student_name } = req.body;
  try {
    const client = await pool.connect();
    // คำสั่ง SQL สำหรับ Insert (ใช้ $1, $2 เพื่อป้องกันการโดนแฮกแบบ SQL Injection)
    await client.query(
      'INSERT INTO students (student_id, student_name) VALUES ($1, $2)',
      [student_id, student_name]
    );
    client.release();
    res.redirect('/'); // บันทึกเสร็จ ให้เด้งกลับไปหน้าแรก
  } catch (err) {
    res.send(renderError('เกิดข้อผิดพลาดในการเพิ่มข้อมูล', err.message));
  }
});

// ---------------------------------------------------------
// เส้นทางที่ 3: (POST /delete) รับ ID มาเพื่อลบข้อมูล
// ---------------------------------------------------------
app.post('/delete', async (req, res) => {
  const { id } = req.body; // รับ ID ที่ซ่อนไว้ในฟอร์ม
  try {
    const client = await pool.connect();
    // คำสั่ง SQL สำหรับลบข้อมูลตาม ID
    await client.query('DELETE FROM students WHERE id = $1', [id]);
    client.release();
    res.redirect('/'); // ลบเสร็จ ให้เด้งกลับไปหน้าแรก
  } catch (err) {
    res.send(renderError('เกิดข้อผิดพลาดในการลบข้อมูล', err.message));
  }
});

// หน้าจอแสดง Error แบบสวยงาม แทนข้อความดิบ
function renderError(title, detail) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>เกิดข้อผิดพลาด</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Noto Sans Thai', sans-serif; background: #f1f3f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
  .box { background: white; border: 1px solid #fecaca; border-radius: 14px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 8px 24px rgba(16,24,40,0.08); }
  .box h2 { color: #dc2626; margin: 12px 0 8px; font-size: 18px; }
  .box p { color: #6b7280; font-size: 13.5px; word-break: break-word; }
  .box a { display: inline-block; margin-top: 18px; background: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; }
</style>
</head>
<body>
  <div class="box">
    <h2>${title}</h2>
    <p>${detail}</p>
    <a href="/">กลับหน้าแรก</a>
  </div>
</body>
</html>`;
}

// สั่งให้ Server เริ่มทำงาน
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
