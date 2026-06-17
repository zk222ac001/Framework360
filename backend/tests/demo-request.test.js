const request = require("supertest");

const {
  app,
  prisma,
  createCompanyWithUser,
  login,
} = require("./testHelpers");

const validPayload = {
  email: "person@acme.com",
  firstName: "Ada",
  lastName: "Lovelace",
  companyName: "Acme",
  jobTitle: "CTO",
  country: "Denmark",
};

describe("Demo request submission", () => {
  it("creates a demo request for a company email", async () => {
    const res = await request(app)
      .post("/demo-requests")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(validPayload.email);
  });

  it("rejects personal email domains", async () => {
    const res = await request(app)
      .post("/demo-requests")
      .send({ ...validPayload, email: "person@gmail.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please use your company email address");
    expect(await prisma.demoRequest.count()).toBe(0);
  });

  it("rejects emails already registered in the system", async () => {
    await createCompanyWithUser({ email: "existing@acme.com" });

    const res = await request(app)
      .post("/demo-requests")
      .send({ ...validPayload, email: "Existing@Acme.com" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(
      "This email is already registered in the system",
    );
    expect(await prisma.demoRequest.count()).toBe(0);
  });
});

describe("Admin demo request management", () => {
  async function loginPlatformAdmin() {
    const admin = await createCompanyWithUser({
      email: "platform-admin@framework360.test",
      role: "PLATFORM_ADMIN",
    });
    const { cookies } = await login(admin.user.email);

    return cookies;
  }

  it("allows a platform admin to edit a demo request", async () => {
    const cookies = await loginPlatformAdmin();
    const demoRequest = await prisma.demoRequest.create({
      data: validPayload,
    });

    const res = await request(app)
      .patch(`/demo-requests/${demoRequest.id}`)
      .set("Cookie", cookies)
      .send({
        ...validPayload,
        email: "Updated.Person@Acme.com",
        firstName: "Grace",
        lastName: "Hopper",
        companyName: "Updated Acme",
      });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("updated.person@acme.com");
    expect(res.body.firstName).toBe("Grace");
    expect(res.body.lastName).toBe("Hopper");
    expect(res.body.companyName).toBe("Updated Acme");
  });

  it("allows a platform admin to delete a pending demo request", async () => {
    const cookies = await loginPlatformAdmin();
    const demoRequest = await prisma.demoRequest.create({
      data: validPayload,
    });

    const res = await request(app)
      .delete(`/demo-requests/${demoRequest.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true, deletedUser: false });
    expect(
      await prisma.demoRequest.findUnique({ where: { id: demoRequest.id } }),
    ).toBeNull();
  });

  it("deletes an activated demo request and its linked user", async () => {
    const cookies = await loginPlatformAdmin();
    const { company, user } = await createCompanyWithUser({
      email: "activated-user@acme.com",
      companyName: "Activated Acme",
    });
    const demoRequest = await prisma.demoRequest.create({
      data: {
        ...validPayload,
        email: user.email,
        status: "ACTIVATED",
        companyId: company.id,
        createdUserId: user.id,
      },
    });

    const res = await request(app)
      .delete(`/demo-requests/${demoRequest.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true, deletedUser: true });
    expect(
      await prisma.demoRequest.findUnique({ where: { id: demoRequest.id } }),
    ).toBeNull();
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
  });
});
