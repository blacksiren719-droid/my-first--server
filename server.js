const http = require('http');
// 1. เรียกใชงาน Pool จากไลบรารี pg สําหรับจัดการการเชื่อมตอฐานขอมูล
const { Pool } = require('pg');
// 2. ตั้งคาการเชื่อมตอ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});
const port = process.env.PORT || 3000;
const server = http.createServer(async (req, res) => {
res.statusCode = 200;
res.setHeader('Content-Type', 'text/html; charset=utf-8');

try {
// 3. ขอเชื่อมตอและสงคําสั่ง SQL ไปดึงขอมูลจากตาราง students
const client = await pool.connect();
const result = await client.query('SELECT * FROM students');
client.release(); // คนืการเชื่อมตอเมื่อใชงานเสร็จ
// 4. นําขอมูลที่ได(result.rows) มาประกอบเปนตาราง HTML
let html = `<h1>ฐานขอมูลนักศึกษา (ทดสอบการเชื่อมตอ)</h1>`;
html += `<table border="1" cellpadding="10">`;
html += `<tr><th>รหัสนักศึกษา</th><th>ชื่อ-นามสกุล</th></tr>`;
// วนลูปนําขอมูลแตละแถวมาแสดง
result.rows.forEach(row => {
html += `<tr><td>${row.student_id}</td><td>${row.student_name}</td></tr>`;
});
html += `</table>`;
res.end(html);
} catch (err) {
// กรณเีชื่อมตอไมไดหรือเขียนชื่อตารางผิด
console.error(err);
res.end(`<h1>เกิดขอผิดพลาด!</h1><p>${err.message}</p>`);
}
});
server.listen(port, () => {
console.log(`Server is running on port: ${port}`);
});
