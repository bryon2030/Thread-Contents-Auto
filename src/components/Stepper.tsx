import { useApp } from '../store/AppContext';

export function Stepper() {
    const { app } = useApp();
    const steps = ['타겟 설정', '키워드', '주제 선정', '기사 추천', '글 완성'];

    // Don't show stepper in Settings view (step 0), show from step 1
    if (app.step === 0) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
            {/* ProgressBar Background */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                right: '20px',
                height: '2px',
                background: 'hsl(var(--color-border))',
                zIndex: 0,
                transform: 'translateY(-50%)'
            }} />

            {/* ProgressBar Active */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                height: '2px',
                background: 'hsl(var(--color-primary))',
                zIndex: 0,
                transform: 'translateY(-50%)',
                width: `${((app.step - 1) / (steps.length - 1)) * 100}%`,
                transition: 'width 0.3s ease'
            }} />

            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === app.step;
                const isCompleted = stepNum < app.step;

                return (
                    <div key={label} style={{ position: 'relative', zIndex: 1, backgroundColor: 'hsl(var(--color-bg))', padding: '0 8px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isActive || isCompleted ? 'hsl(var(--color-primary))' : 'hsl(var(--color-surface))',
                            border: `2px solid ${isActive || isCompleted ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                            color: isActive || isCompleted ? 'white' : 'hsl(var(--color-text-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            margin: '0 auto',
                            transition: 'all 0.3s ease'
                        }}>
                            {stepNum}
                        </div>
                        <div style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            marginTop: '8px',
                            color: isActive ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-secondary))',
                            fontWeight: isActive ? 600 : 400
                        }}>
                            {label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
