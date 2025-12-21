import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from 'path';
import authRoutes from "../routes/auth.routes";
import empresaRoutes from "../routes/empresa.routes";
import categoriasRoutes from "../modules/empresas/routes/categorias.routes";
import activosRoutes from "../routes/activos.routes";
import informesRoutes from "../routes/informes.routes";
import uploadsRoutes from "../routes/uploads.routes";
import publicRoutes from "../routes/public.routes";
import slaRoutes from "../routes/sla.routes";
import catalogoRoutes from "../modules/catalogo/routes/catalogo.routes";

const app = express();

app.use(cors());
app.use(express.json());
// Also accept urlencoded form bodies (from forms or some frontend libraries)
app.use(express.urlencoded({ extended: true }));

// Debug ALL requests
app.use((req, res, next) => {
  if (req.path.includes('/sla/')) {
    console.log('[DEBUG] Request to SLA:', {
      method: req.method,
      path: req.path,
      url: req.url,
      body: req.body,
    });
  }
  next();
});

// Serve uploaded files from /uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/activos", activosRoutes);
app.use("/api/informes", informesRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/sla", slaRoutes);
app.use("/api/catalogo", catalogoRoutes);
app.use('/public', publicRoutes);

// Debug endpoint to list registered routes (temporary)
app.get("/debug/routes", (req, res) => {
	try {
		const routes: string[] = [];
		// @ts-ignore access internal express stack
		const routerStack = app._router && app._router.stack ? app._router.stack : null;
		if (!routerStack) {
			return res.json({ message: 'no router stack' });
		}
		routerStack.forEach((middleware: any) => {
			try {
				if (middleware.route) {
					const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
					routes.push(`${methods} ${middleware.route.path}`);
					return;
				}

				if (middleware.name === 'router' && middleware.handle && Array.isArray(middleware.handle.stack)) {
					middleware.handle.stack.forEach((handler: any) => {
						if (handler.route) {
							const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
							routes.push(`${methods} ${handler.route.path}`);
						}
					});
					return;
				}

				// fallback: note middleware name
				if (middleware.name) {
					routes.push(`MIDDLEWARE ${middleware.name}`);
				}
			} catch (inner) {
				// ignore individual middleware errors
			}
		});
		res.json({ routes });
	} catch (err) {
		res.status(500).json({ message: 'Error enumerando rutas', error: String(err) });
	}
});

// Error handler JSON (ensure no HTML error pages leak)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	const status = err && (err.status || err.code === '23505' ? 409 : 500) || 500;
	const message = err && (err.message || 'Error en el servidor') || 'Error en el servidor';
	try {
		console.error('[ERROR]', { path: req.originalUrl, status, message, err });
	} catch (_) { /* noop */ }
	res.status(status).json({ error: message });
});

const PORT = Number(process.env.PORT) || 4000;
// Bind to 0.0.0.0 to ensure the server listens on all interfaces (IPv4 + IPv6 fallback)
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en puerto ${PORT}`));
