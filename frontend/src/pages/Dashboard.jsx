import SideBar from "../components/Sidebar.jsx"
import { IoMdStats, IoMdPeople, IoMdCart, IoMdNotifications, IoMdTime, IoMdArrowUp, IoMdArrowDown } from "react-icons/io"
import { FiActivity, FiDollarSign, FiUsers, FiShoppingBag, FiPieChart } from "react-icons/fi"

function Dashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231",
      change: "+12.5%",
      trend: "up",
      icon: FiDollarSign,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Active Users",
      value: "2,431",
      change: "+8.2%",
      trend: "up",
      icon: FiUsers,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Orders",
      value: "1,234",
      change: "-3.1%",
      trend: "down",
      icon: FiShoppingBag,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "+5.4%",
      trend: "up",
      icon: FiPieChart,
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50"
    }
  ]

  const recentActivities = [
    { id: 1, user: "John Doe", action: "placed an order", time: "2 minutes ago", type: "order" },
    { id: 2, user: "Jane Smith", action: "completed payment", time: "15 minutes ago", type: "payment" },
    { id: 3, user: "Mike Johnson", action: "updated profile", time: "1 hour ago", type: "profile" },
    { id: 4, user: "Sarah Wilson", action: "subscribed to newsletter", time: "2 hours ago", type: "subscription" },
    { id: 5, user: "Tom Brown", action: "left a review", time: "3 hours ago", type: "review" }
  ]

  return (
    <>
      <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
        <SideBar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Accent */}
                  <div className={`absolute top-0 left-0 w-28 h-28 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-full blur-2xl`}></div>

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="text-gray-700" size={24} />
                      </div>
                      {stat.trend === "up" ? (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-sm font-medium">
                          <IoMdArrowUp size={14} />
                          <span>{stat.change}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-sm font-medium">
                          <IoMdArrowDown size={14} />
                          <span>{stat.change}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts and Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Chart Area */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Revenue Overview</h2>
                  <p className="text-sm text-gray-600">Last 30 days performance</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                    Week
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200">
                    Month
                  </button>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border-2 border-dashed border-primary-200 flex items-center justify-center">
                <div className="text-center">
                  <IoMdStats className="mx-auto text-primary-400 mb-2" size={48} />
                  <p className="text-sm text-gray-600">Chart visualization area</p>
                  <p className="text-xs text-gray-500 mt-1">Integrate your preferred charting library</p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <FiActivity className="text-primary-600" size={20} />
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary-50 transition-colors duration-200 group cursor-pointer"
                    style={{ animationDelay: `${(index + 4) * 100}ms` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 group-hover:scale-150 transition-transform duration-200"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        <span className="text-gray-600">{activity.action}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <IoMdTime className="text-gray-400" size={12} />
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200">
                View all activities
              </button>
            </div>
          </div>          
        </main>
      </div>
    </>
  )
}

export default Dashboard;