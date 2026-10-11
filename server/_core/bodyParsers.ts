import express, { type Express } from "express";

export function registerBodyParsers(app: Express) {
  // Select the limit before reading the stream. A later parser cannot override
  // an earlier parser's rejection of a large request.
  const largeJson = express.json({ limit: "10mb" });
  const standardJson = express.json({ limit: "1mb" });
  const uploadJson = express.json({ limit: "70mb" }); // 50 MB + base64/JSON overhead.
  app.use((req, res, next) => {
    const procedures = req.path.startsWith("/api/trpc/")
      ? req.path.slice("/api/trpc/".length).split(",")
      : [];
    const deliveryOnly = procedures.length > 0 && procedures.every(
      name => /^(email|pdfDelivery)\.[A-Za-z][A-Za-z0-9]*$/.test(name)
    );
    const uploadOnly = procedures.length === 1 && procedures[0] === "documents.upload";
    return (uploadOnly ? uploadJson : deliveryOnly ? largeJson : standardJson)(req, res, next);
  });
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
}
