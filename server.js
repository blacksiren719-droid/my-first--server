const http = require('http');
// 1. เรียกใชงาน Pool จากไลบรารี pg สําหรับจัดการการเชื่อมตอฐานขอมูล
const { Pool } = require('pg');
// 2. ตั้งคาการเชื่อมตอ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const port = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // สไตล์หลักที่ใช้ร่วมกันทั้งหน้า
  const styleBlock = `
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }
      .container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 40px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 800px;
        width: 100%;
        animation: fadeIn 0.6s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      h1 {
        text-align: center;
        color: #4c1d95;
        margin-bottom: 30px;
        font-size: 1.8em;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      }
      th {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 14px 16px;
        text-align: left;
        font-size: 0.95em;
        letter-spacing: 0.3px;
      }
      td {
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      tr:nth-child(even) { background: #f8f7fc; }
      tr:hover td {
        background: #ede9fe;
        transition: background 0.25s ease;
      }
      .error-box {
        text-align: center;
        color: #b91c1c;
      }
      .error-box h1 { color: #b91c1c; }
      .error-box p {
        background: #fee2e2;
        padding: 12px;
        border-radius: 10px;
        font-family: monospace;
      }
      .empty {
        text-align: center;
        color: #888;
        padding: 20px;
      }
    </style>
  `;

  try {
    // 3. ขอเชื่อมตอและสงคําสั่ง SQL ไปดึงขอมูลจากตาราง students
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM students');
    client.release(); // คนืการเชื่อมตอเมื่อใชงานเสร็จ

    // 4. นําขอมูลที่ได(result.rows) มาประกอบเปนตาราง HTML
    let rowsHtml = '';
    if (result.rows.length === 0) {
      rowsHtml = `<tr><td colspan="2" class="empty">ยังไม่มีข้อมูลนักศึกษา</td></tr>`;
    } else {
      result.rows.forEach(row => {
        rowsHtml += `<tr><td>${row.student_id}</td><td>${row.student_name}</td></tr>`;
      });
    }

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
          <h1>🎓 ฐานข้อมูลนักศึกษา (ทดสอบการเชื่อมต่อ)</h1>
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
    // กรณเีชื่อมตอไมไดหรือเขียนชื่อตารางผิด
    console.error(err);
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
          <h1>⚠️ เกิดข้อผิดพลาด!</h1>
          <p>${err.message}</p>
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
