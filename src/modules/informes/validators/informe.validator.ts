import Joi from 'joi';

const imageSchema = Joi.alternatives().try(
  Joi.object({ url: Joi.string().uri().required() }),
  Joi.object({ base64: Joi.string().max(5 * 1024 * 1024).required() })
);

const schema = Joi.object({
  empresaId: Joi.number().integer().optional().allow(null),
  assetId: Joi.string().max(100).required(),
  empresaNombre: Joi.string().max(200).required(),
  sedeNombre: Joi.string().max(200).required(),
  form: Joi.object({
    diagnosis: Joi.string().allow('').max(2000),
    tests: Joi.string().allow('').max(2000),
    recommendations: Joi.string().allow('').max(2000),
    configurations: Joi.string().allow('').max(2000),
    softwareInstalled: Joi.array().items(Joi.string().max(200)).default([]),
    observations: Joi.string().allow('').max(2000)
  }).required(),
  tech: Joi.object({ name: Joi.string().max(200).required(), email: Joi.string().email().required() }).required(),
  date: Joi.date().iso().required(),
  photos: Joi.array().items(imageSchema).max(10).default([]),
  signature: imageSchema.allow(null),
  metadata: Joi.object({ usuarioId: Joi.number().integer().required(), empresaId: Joi.number().integer().optional(), idioma: Joi.string().valid('es','en').default('es'), formato: Joi.string().valid('A4','LETTER').default('A4') }).required()
});

export const validateInformePayload = (payload: any) => schema.validate(payload, { abortEarly: false });
