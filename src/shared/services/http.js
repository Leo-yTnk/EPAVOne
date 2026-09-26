export class HttpError extends Error {
  constructor(message,{status,cause}={}) { super(message,{cause}); this.name='HttpError'; this.status=status; }
}
export async function requestJson(url,options={}) {
  const response=await fetch(url,options);
  if(!response.ok) throw new HttpError('Falha na requisição',{status:response.status});
  return response.json();
}
