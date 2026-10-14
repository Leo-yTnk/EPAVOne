const periods = {
  dawn: {
    greeting: 'Bom dia',
    label: 'Um começo tranquilo',
    icon: 'sun',
    title: 'Cada começo traz uma possibilidade.',
    message: 'Respire, organize uma ideia e dê o primeiro passo. Você não precisa resolver tudo de uma vez.'
  },
  morning: {
    greeting: 'Bom dia',
    label: 'Uma manhã de possibilidades',
    icon: 'sun',
    title: 'Hoje pode render boas conexões.',
    message: 'Uma boa conversa começa com atenção. Ouça o que cada cliente precisa e deixe as ideias encontrarem espaço.'
  },
  afternoon: {
    greeting: 'Boa tarde',
    label: 'Seu ritmo, suas conquistas',
    icon: 'sun',
    title: 'Ainda há tempo para uma boa ideia.',
    message: 'Cada atendimento ensina alguma coisa. Valorize o que já fez e escolha com calma seu próximo passo.'
  },
  evening: {
    greeting: 'Boa noite',
    label: 'Hora de desacelerar',
    icon: 'moon',
    title: 'Reconheça o caminho que fez hoje.',
    message: 'Pequenos avanços também contam. Guarde o que aprendeu e prepare o amanhã com tranquilidade.'
  },
  night: {
    greeting: 'Boa noite',
    label: 'Um momento de tranquilidade',
    icon: 'moon',
    title: 'Boas ideias também precisam de descanso.',
    message: 'Se estiver por aqui, faça uma coisa de cada vez. Seu próximo passo pode esperar por um novo dia.'
  }
};
export function getDayPeriod(date = new Date()) {
  const hour = date.getHours();
  const key = hour < 5 ? 'night' : hour < 8 ? 'dawn' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return { key, ...periods[key] };
}
