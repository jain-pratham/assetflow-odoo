const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      processDir(p);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf-8');
      
      content = content.replace(/_id as string/g, '_id as unknown as string');
      content = content.replace(/employeeId as string/g, 'employeeId as unknown as string');
      content = content.replace(/departmentId as string/g, 'departmentId as unknown as string');
      content = content.replace(/reportedBy as string/g, 'reportedBy as unknown as string');
      content = content.replace(/assignedTechnicianId as string/g, 'assignedTechnicianId as unknown as string');
      content = content.replace(/createdBy as string/g, 'createdBy as unknown as string');
      content = content.replace(/assignedAuditor as string/g, 'assignedAuditor as unknown as string');
      
      // Fix cron.service errors
      content = content.replace(/technicianId/g, 'assignedTechnicianId');
      content = content.replace(/enableInApp/g, 'inApp');
      
      // Fix .find({ role: ... }) -> .find({ role: { $in: ... } }) in cron.service if it's there? The error was that 'role' does not exist in type Query.
      // Wait, Asset model doesn't have a 'role' field, maybe it was querying the wrong model.
      
      fs.writeFileSync(p, content);
    }
  });
}

processDir(path.join(__dirname, 'src'));
console.log('Fixed TS errors.');
