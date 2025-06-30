export default function About() {
  return (
    <div className="overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center space-x-4 mb-8">
              <img src="/logo.svg" alt="Inventoria" className="h-16 w-16" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventoria</h1>
                <p className="text-gray-600">Local Inventory Management System</p>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">About This Application</h2>
                <p className="text-gray-700 leading-relaxed">
                  Inventoria is a comprehensive local inventory management system designed to help Industria
                  track their stock levels, manage items, and monitor activity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Inventory Management</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Item tracking and categorization</li>
                      <li>• Stock level monitoring</li>
                      <li>• Low stock alerts</li>
                      <li>• Barcode/SKU support</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Role-based access control</li>
                      <li>• Admin, Overseer, and User roles</li>
                      <li>• Activity tracking</li>
                      <li>• User permissions</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technology Stack</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• React + TypeScript</li>
                      <li>• Tailwind CSS</li>
                      <li>• Radix UI Components</li>
                      <li>• React Query</li>
                      <li>• Wouter Router</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Node.js + Express</li>
                      <li>• TypeScript</li>
                      <li>• Drizzle ORM</li>
                      <li>• PostgreSQL Database</li>
                      <li>• Session Management</li>
                    </ul>
                  </div>
                </div>
              </section>

              

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">For Users</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Navigate through the application using the sidebar. Access inventory management,
                      view activity logs, and manage your items with ease.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">For Overseers</h3>
                    <p className="text-gray-700 leading-relaxed">
                      See latest changes and monitor activity across the system.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">For Administrators</h3>
                    <p className="text-gray-700 leading-relaxed">
                      As an admin, you have access to user management, settings, database operations,
                      and all inventory features. Use the database panel to backup and restore data.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Credits</h2>
                <p className="text-gray-700 leading-relaxed">
                  Made by William A.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
  );
}
