const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    
    // Remove literal backslashes before backticks
    content = content.replace(/\\`/g, '`');
    // Remove literal backslashes before dollar signs
    content = content.replace(/\\\$/g, '$');
    
    // Also fix the ObjectId to string conversion error: ' _id as string' to ' _id.toString()'
    content = content.replace(/ _id as string/g, ' _id.toString()');
    content = content.replace(/ _id as any/g, ' _id.toString()');
    content = content.replace(/employeeId as string/g, 'employeeId.toString()');
    content = content.replace(/departmentId as string/g, 'departmentId.toString()');
    content = content.replace(/reportedBy as string/g, 'reportedBy.toString()');
    content = content.replace(/assignedTechnicianId as string/g, 'assignedTechnicianId.toString()');
    content = content.replace(/createdBy as string/g, 'createdBy.toString()');
    content = content.replace(/assignedAuditor as string/g, 'assignedAuditor.toString()');
    
    fs.writeFileSync(p, content);
  }
});
console.log('Fixed syntax and type errors.');
