import "dotenv/config";
import sequelize from "../database";
import User from "../models/User";
import Company from "../models/Company";

async function main() {
  const email = "admin@admin.com";
  const password = "123456";
  const name = "Admin";

  try {
    await sequelize.authenticate();

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`[create-admin-user] Usuário já existe: ${email} (id=${existing.id})`);
      process.exit(0);
      return;
    }

    let company = await Company.findOne({ order: [["id", "ASC"]] });
    if (!company) {
      company = await Company.create({
        name: "Default Company",
        email: "no-reply@localhost",
        phone: "",
        status: true,
        planId: null as any
      } as any);
      console.log(`[create-admin-user] Empresa padrão criada: id=${company.id}`);
    }

    const user = await User.create({
      email,
      password,
      name,
      companyId: company.id,
      profile: "admin",
      startWork: "00:00",
      endWork: "23:59",
      showDashboard: "enabled",
      allowSeeMessagesInPendingTickets: "enabled"
    } as any);

    console.log(`[create-admin-user] Usuário criado: id=${user.id}, email=${email}, companyId=${company.id}`);
    process.exit(0);
  } catch (err) {
    console.error("[create-admin-user] Erro:", err);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
}

main();
