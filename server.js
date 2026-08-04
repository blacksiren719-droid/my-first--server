const http = require('http');
// 1. เรียกใช้งาน Pool จากไลบรารี pg สำหรับจัดการการเชื่อมต่อฐานข้อมูล
const { Pool } = require('pg');
// 2. ตั้งค่าการเชื่อมต่อ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const port = process.env.PORT || 3000;

// ป้องกันปัญหา HTML ผิดรูป กรณีชื่อมีอักขระพิเศษ เช่น <, >, &
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // สไตล์หลักที่ใช้ร่วมกันทั้งหน้า — ธีมดำทอง
  const styleBlock = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Taviraj:wght@500;600;700&family=Sarabun:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif;
        background: radial-gradient(circle at top, #1b1a17 0%, #050505 72%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }
      .container {
        position: relative;
        background: #131210;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 14px;
        padding: 48px 40px;
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.75), 0 0 50px rgba(212, 175, 55, 0.07);
        max-width: 800px;
        width: 100%;
        animation: fadeIn 0.7s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      /* มุมกรอบทอง — เหมือนใบประกาศ/เกียรติบัตร ให้ความรู้สึกทางการ */
      .corner {
        position: absolute;
        width: 22px;
        height: 22px;
        border: 2px solid #d4af37;
        opacity: 0.85;
      }
      .corner.tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
      .corner.tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
      .corner.bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
      .corner.br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
      h1 {
        font-family: 'Taviraj', serif;
        text-align: center;
        color: #e8c25f;
        margin: 0 0 14px;
        font-size: 1.9em;
        font-weight: 600;
        letter-spacing: 0.3px;
        text-shadow: 0 0 22px rgba(212, 175, 55, 0.3);
      }
      .divider {
        width: 90px;
        height: 2px;
        margin: 0 auto 32px;
        background: linear-gradient(90deg, transparent, #d4af37, transparent);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
      }
      th {
        font-family: 'Taviraj', serif;
        background: linear-gradient(135deg, #a9822d, #e8c25f, #a9822d);
        color: #1a1400;
        padding: 14px 18px;
        text-align: left;
        font-size: 0.95em;
        font-weight: 600;
        letter-spacing: 0.4px;
      }
      td {
        padding: 13px 18px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.14);
        color: #e9dfc4;
        font-weight: 300;
      }
      tr:nth-child(even) td { background: rgba(212, 175, 55, 0.035); }
      tr:hover td {
        background: rgba(212, 175, 55, 0.13);
        color: #fff8e7;
        transition: background 0.25s ease, color 0.25s ease;
      }
      .error-box h1 { color: #ff6b6b; text-shadow: none; }
      .error-box .divider { background: linear-gradient(90deg, transparent, #ff6b6b, transparent); }
      .error-box .corner { border-color: #ff6b6b; }
      .error-box p {
        background: rgba(255, 107, 107, 0.08);
        border: 1px solid rgba(255, 107, 107, 0.3);
        color: #ffb3b3;
        padding: 14px 16px;
        border-radius: 8px;
        font-family: Consolas, monospace;
        font-size: 0.9em;
        word-break: break-word;
      }
      .hint {
        margin-top: 20px;
        font-size: 0.85em;
        color: rgba(232, 221, 199, 0.55);
        line-height: 1.7;
      }
      .hint b { color: rgba(232, 221, 199, 0.8); }
      .empty {
        text-align: center;
        color: rgba(232, 221, 199, 0.45);
        padding: 22px;
        font-weight: 300;
      }
    </style>
  `;

  try {
    // 3. ขอเชื่อมต่อฐานข้อมูล
    const client = await pool.connect();

    // 4. สร้างตาราง students อัตโนมัติถ้ายังไม่มี
    //    (กันปัญหา error "relation students does not exist" ซึ่งเป็นสาเหตุที่พบบ่อยที่สุด)
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL
      )
    `);

    // 5. ส่งคำสั่ง SQL ไปดึงข้อมูลจากตาราง students
    const result = await client.query('SELECT * FROM students');
    client.release(); // คืนการเชื่อมต่อเมื่อใช้งานเสร็จ

    // 6. นำข้อมูลที่ได้ (result.rows) มาประกอบเป็นตาราง HTML
    let rowsHtml = '';
    if (result.rows.length === 0) {
      rowsHtml = `<tr><td colspan="2" class="empty">ยังไม่มีข้อมูลนักศึกษา</td></tr>`;
    } else {
      result.rows.forEach(row => {
        rowsHtml += `<tr><td>${escapeHtml(row.student_id)}</td><td>${escapeHtml(row.student_name)}</td></tr>`;
      });
    }

    res.statusCode = 200;
    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>ฐานข้อมูลนักศึกษา</title>
        ${styleBlock}
      </head>
      <body>
        <div class="container">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          <h1>🎓 ฐานข้อมูลนักศึกษา</h1>
          <div class="divider"></div>
          <table>
            <tr><th>รหัสนักศึกษา</th><th>ชื่อ-นามสกุล</th></tr>
            ${rowsHtml}
          </table>
        </div>
      </body>
      </html>
    `;
    res.end(html);
  } catch (err) {
    // กรณีเชื่อมต่อไม่ได้หรือเขียนชื่อตารางผิด
    console.error(err);
    res.statusCode = 500;
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>เกิดข้อผิดพลาด</title>
        ${styleBlock}
      </head>
      <body>
        <div class="container error-box">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          <h1>⚠️ เกิดข้อผิดพลาด</h1>
          <div class="divider"></div>
          <p>${escapeHtml(err.message)}</p>
          <div class="hint">
            <b>ตรวจสอบเบื้องต้น:</b><br>
            1) ตัวแปร DATABASE_URL ถูกผูกจากเซอร์วิส Postgres เข้ากับเซอร์วิสนี้แล้วหรือยัง (ดูที่แท็บ Variables)<br>
            2) แพ็กเกจ <code>pg</code> อยู่ใน package.json แล้วหรือยัง<br>
            3) เซอร์วิส Postgres ยังทำงานอยู่ (ไม่ได้ sleep/ลบไปแล้ว)
          </div>
        </div>
      </body>
      </html>
    `;
    res.end(errorHtml);
  }
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
