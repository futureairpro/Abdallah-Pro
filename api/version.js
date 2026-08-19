// 🚀 Deployment Verification Endpoint
export default function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    version: '2.5.0-MultiTenant-DoctorOS',
    multitenant_active: true,
    webapp_dashboard: true,
    pricing_monthly_egp: 30,
    deployed_at: new Date().toISOString()
  });
}
