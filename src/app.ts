import express, { Response as ExResponse, Request as ExRequest, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import appConfig from './config';
import { RegisterRoutes } from './generated/routes';
import { ValidateError } from 'tsoa';

const app = express();

// Middlewares
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// 增加JSON请求体的大小限制 (例如，10MB)
// 对于Base64图片，这个限制可能需要根据您的图片大小预期进行调整
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // 也为url-encoded增加限制

// Tsoa Generated Routes
RegisterRoutes(app);

// Swagger UI
try {
  const swaggerDocument = require('../swagger.json');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log(`Swagger docs available at http://localhost:${appConfig.PORT}/docs`);
} catch (err) {
  console.error('Failed to load swagger.json or setup Swagger UI:', err);
  console.log('Ensure `npm run swagger` (or `npm run build`) has been run to generate swagger.json');
}

// Global Error Handler
app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction
): ExResponse | void {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }
  if (err instanceof Error) {
    console.error(`Error for ${req.path}:`, err.message, err.stack);
    const tsoaError = err as any;
    if (!res.headersSent) {
        const statusCode = tsoaError.status || tsoaError.statusCode || 500;
        return res.status(statusCode).json({
            message: tsoaError.message || "Internal Server Error",
        });
    }
  } else if (typeof err === 'object' && err !== null && 'status' in err && 'message' in err) {
    const customError = err as { status: number; message: string; details?: any };
     if (!res.headersSent) {
        return res.status(customError.status).json({ message: customError.message, details: customError.details });
     }
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({ message: "An unexpected error occurred" });
});

app.listen(appConfig.PORT, () => {
  console.log(`Server is running on http://localhost:${appConfig.PORT}`);
  console.log(`API base path: /api/v1`);
});