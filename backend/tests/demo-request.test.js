const request = require("supertest");

const { app, prisma, createCompanyWithUser } = require("./testHelpers");

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
