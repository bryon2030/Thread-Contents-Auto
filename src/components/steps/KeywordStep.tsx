import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { AIManager } from '../../services/ai/manager';

export function KeywordStep() {
    const { app, settings, dispatch } = useApp();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customKeyword, setCustomKeyword] = useState('');

    const selectedCount = app.keywords.filter(k => k.selected).length;

    const handleNext = async () => {
        if (selectedCount === 0) return;

        setLoading(true);
        setError(null);
        try {
            const selectedKeywords = app.keywords.filter(k => k.selected).map(k => k.text);
            const topics = await AIManager.generateTopics(settings, selectedKeywords);
            dispatch({ type: 'SET_TOPICS', payload: topics });
            dispatch({ type: 'SET_STEP', payload: 3 });
        } catch (err: any) {
            console.error(err);
            if (err.message === 'OpenAI API Call Failed' || err.message === 'Gemini API Call Failed') {
                setError('API 호출 실패. API Key를 확인하세요.');
            } else {
                setError('주제를 생성하지 못했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleKeyword = (id: string, current: boolean) => {
        dispatch({ type: 'UPDATE_KEYWORD', payload: { id, updates: { selected: !current } } });
    };

    const updateText = (id: string, text: string) => {
        dispatch({ type: 'UPDATE_KEYWORD', payload: { id, updates: { text } } });
    };

    const handleAddKeyword = () => {
        if (!customKeyword.trim()) return;
        const newKeyword = {
            id: Date.now().toString(),
            text: customKeyword.trim(),
            selected: true
        };
        dispatch({ type: 'SET_KEYWORDS', payload: [...app.keywords, newKeyword] });
        setCustomKeyword('');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                관심 키워드 선택
            </h2>
            <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '2rem' }}>
                관심 있는 키워드를 선택해주세요. 텍스트를 직접 수정할 수도 있습니다.
                관심 있는 키워드를 선택해주세요. 텍스트를 직접 수정할 수도 있습니다.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="원하는 키워드 직접 입력"
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--color-border))',
                        fontSize: '1rem'
                    }}
                />
                <button
                    onClick={handleAddKeyword}
                    className="btn-secondary"
                    disabled={!customKeyword.trim()}
                    style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
                >
                    + 추가
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '2rem'
            }}>
                {app.keywords.map(k => (
                    <div
                        key={k.id}
                        onClick={() => toggleKeyword(k.id, k.selected)}
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${k.selected ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                            background: k.selected ? 'hsl(225, 70%, 96%)' : 'hsl(var(--color-surface))',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={k.selected}
                            readOnly
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <input
                            type="text"
                            value={k.text}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateText(k.id, e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                outline: 'none',
                                fontWeight: k.selected ? 600 : 400,
                                color: k.selected ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-primary))'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--color-border))',
                        color: 'hsl(var(--color-text-secondary))'
                    }}
                >
                    이전
                </button>
                <button
                    className="btn-primary"
                    onClick={handleNext}
                    disabled={loading || selectedCount === 0}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {loading ? '주제 생성 중...' : (
                        <>
                            주제 생성하기 ({selectedCount}개) <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
            {error && <p style={{ color: 'hsl(var(--color-error))', fontSize: '0.875rem', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
        </div>
    );
}
