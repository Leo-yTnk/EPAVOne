export class AppError extends Error { constructor(message,{code='APP_ERROR',cause}={}) { super(message,{cause}); this.name='AppError'; this.code=code; } }
export class ValidationError extends AppError { constructor(message,options={}) { super(message,{...options,code:'VALIDATION_ERROR'}); this.name='ValidationError'; } }
export class AuthError extends AppError { constructor(message,options={}) { super(message,{...options,code:'AUTH_ERROR'}); this.name='AuthError'; } }
