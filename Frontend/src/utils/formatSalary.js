export const formatSalary = (salary) => {
  if (!salary || !salary.min || !salary.max) return 'Salary not listed';
  
  const min = (salary.min / 1000).toFixed(0);
  const max = (salary.max / 1000).toFixed(0);
  const currency = salary.currency || 'PKR';
  
  return `${currency} ${min}k - ${max}k / month`;
};
