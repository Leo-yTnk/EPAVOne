import { useEffect, useRef, useState } from 'preact/hooks';
import { AppLogo, Button, Card, Dialog, Heading, Icon, Progress, Text } from '../../design-system/components/index.js';
import { tutorialSteps } from './tutorialSteps.js';
import './introduction.css';

export function IntroductionPage({ onComplete }) {
  const [index, setIndex] = useState(0);
  const contentRef = useRef(null);
  const topicRef = useRef(null);
  const step = tutorialSteps[index];
  const last = index === tutorialSteps.length - 1;
  useEffect(() => {
    topicRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    contentRef.current?.focus({ preventScroll: true });
    contentRef.current?.closest('.ds-dialog-content')?.scrollTo?.({ top: 0, behavior: 'instant' });
  }, [index]);
  return (
    <Dialog
      open
      title="Como usar o EPAVOne"
      size="lg"
      onClose={onComplete}
      actions={
        <div className="tutorial-actions">
          <Button variant="ghost" onClick={onComplete}>
            Pular tutorial
          </Button>
          <div className="ds-inline">
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <Icon name="back" /> Anterior
            </Button>
            <Button onClick={() => (last ? onComplete() : setIndex(index + 1))}>
              {last ? 'Começar a usar' : 'Próximo'} <Icon name={last ? 'check' : 'next'} />
            </Button>
          </div>
        </div>
      }
    >
      <section className="tutorial" aria-label="Guia completo do EPAVOne">
        <Progress
          label="Seu guia do EPAVOne"
          value={index + 1}
          max={tutorialSteps.length}
          formatValue={(value, max) => `${value} de ${max}`}
        />
        <div className="tutorial-layout">
          <nav className="tutorial-topics" aria-label="Etapas do tutorial">
            {tutorialSteps.map((item, position) => (
              <Button
                key={item.topic}
                ref={position === index ? topicRef : undefined}
                variant={position === index ? 'secondary' : 'ghost'}
                aria-current={position === index ? 'step' : undefined}
                onClick={() => setIndex(position)}
              >
                <span>
                  {String(position + 1).padStart(2, '0')} · {item.topic}
                </span>
              </Button>
            ))}
          </nav>
          <div ref={contentRef} className="tutorial-content" tabIndex="-1" aria-label={`Etapa ${index + 1}: ${step.topic}`}>
            <AppLogo product={step.app} wordmark />
            <Heading as="h3" level={2}>
              {step.title}
            </Heading>
            <Text>{step.copy}</Text>
            <ol className="tutorial-instructions">
              {step.items.map(([title, copy]) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
            <Card padding="compact" className="tutorial-tip">
              <Icon name="insights" />
              <Text size="sm">{step.tip}</Text>
            </Card>
          </div>
        </div>
      </section>
    </Dialog>
  );
}
