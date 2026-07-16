const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp({
  frontendOrigin: "http://localhost:5173"
});

describe("GET /health", () => {
  test("başarılı ortak cevap zarfını döndürür", async () => {
    const response = await request(app)
      .get("/health")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        service: "blindbeat-backend",
        status: "ok"
      },
      error: null,
      requestId: expect.any(String)
    });
  });

  test("gelen request ID değerini korur", async () => {
    const requestId = "test-request-123";

    const response = await request(app)
      .get("/health")
      .set("x-request-id", requestId)
      .expect(200);

    expect(response.headers["x-request-id"]).toBe(requestId);
    expect(response.body.requestId).toBe(requestId);
  });
});

describe("Bilinmeyen endpoint", () => {
  test("404 ortak hata zarfını döndürür", async () => {
    const response = await request(app)
      .get("/does-not-exist")
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "İstenen endpoint bulunamadı."
      },
      requestId: expect.any(String)
    });
  });
});
