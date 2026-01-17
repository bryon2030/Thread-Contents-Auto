import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { AIManager } from '../../services/ai/manager';

export function TargetStep() {
    const { app, settings, dispatch } = useApp();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!app.targetInput.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const keywords = await AIManager.generateKeywords(settings, app.targetInput);
            dispatch({ type: 'SET_KEYWORDS', payload: keywords });
            dispatch({ type: 'SET_STEP', payload: 2 });
        } catch (err: any) {
            console.error(err);
            if (err.message === 'OpenAI API Call Failed' || err.message === 'Gemini API Call Failed') {
                setError('API 호출에 실패했습니다. 설정에서 API Key를 확인해주세요.');
            } else {
                // Show actual error for debugging
                setError(`키워드를 생성하지 못했습니다. (${err.message})`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                누구를 위한 글인가요?
                <span style={{
                    fontSize: '0.8rem',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    marginLeft: '10px',
                    backgroundColor: settings.apiKey ? 'hsl(var(--color-primary))' : 'hsl(var(--color-bg-secondary))',
                    color: settings.apiKey ? 'white' : 'hsl(var(--color-text-secondary))',
                    verticalAlign: 'middle',
                    fontWeight: 'normal'
                }}>
                    {settings.apiKey ? '✨ AI 연동됨' : '🌱 체험판 모드'}
                </span>
            </h2>
            <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1.5rem' }}>
                타겟 독자를 한 문장으로 설명해주세요.
            </p>

            <div style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    value={app.targetInput}
                    onChange={(e) => dispatch({ type: 'SET_TARGET', payload: e.target.value })}
                    placeholder="예) 은퇴 후 제2의 인생을 준비하는 5060"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '1.125rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--color-border))',
                        marginBottom: '1rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                {error && <p style={{ color: 'hsl(var(--color-error))', fontSize: '0.875rem' }}>{error}</p>}
            </div>

            <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={loading || !app.targetInput.trim()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
            >
                {loading ? (
                    '생성 중...'
                ) : (
                    <>
                        키워드 10개 생성하기 <ArrowRight size={20} />
                    </>
                )}
            </button>

            {/* Demo Tip */}
            {app.mode === 'DEMO' && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'hsl(var(--color-bg))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    gap: '8px',
                    color: 'hsl(var(--color-text-secondary))'
                }}>
                    <Sparkles size={16} />
                    <span>팁: 체험판 모드에서는 예시 데이터가 즉시 생성됩니다.</span>
                </div>
            )}
        </div>
    );
}
