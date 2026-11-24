const User = require("../models/User");
const Website = require("../models/Website");
const Request = require("../models/Request");

async function getDashboard(user) {
  if (user.role === "developer") {
    const [clients, websites, requests] = await Promise.all([
      User.countDocuments({ role: "client" }),
      Website.countDocuments(),
      Request.find().select("status priority"),
    ]);

    const byStatus = {};
    requests.forEach((item) => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    return {
      role: "developer",
      stats: {
        clients,
        websites,
        requests: requests.length,
        byStatus,
      },
    };
  }

  const websites = await Website.find({ clientId: user._id }).select("_id");
  const websiteIds = websites.map((site) => site._id);
  const requests = await Request.find({ websiteId: { $in: websiteIds } }).select(
    "status"
  );
  const byStatus = {};
  requests.forEach((item) => {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
  });

  return {
    role: "client",
    stats: {
      websites: websites.length,
      requests: requests.length,
      byStatus,
    },
  };
}

async function listClients() {
  return User.find({ role: "client" }).select("name email isActive createdAt").sort({
    createdAt: -1,
  });
}

module.exports = { getDashboard, listClients };
