import { useEffect, useRef } from 'react';

interface MathRendererProps {
  equation: string;
  className?: string;
}

export const MathRenderer = ({ equation, className = '' }: MathRendererProps) => {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mathRef.current && equation) {
      // Simple LaTeX-like rendering for common mathematical expressions
      const renderMath = (text: string) => {
        // Handle superscripts (^)
        text = text.replace(/\^(\d+)/g, '<sup>$1</sup>');
        
        // Handle subscripts (_)
        text = text.replace(/_(\d+)/g, '<sub>$1</sub>');
        
        // Handle fractions (a/b)
        text = text.replace(/(\w+)\/(\w+)/g, '<span class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></span>');
        
        // Handle square roots (√)
        text = text.replace(/√\(([^)]+)\)/g, '<span class="sqrt">√<span class="radicand">$1</span></span>');
        
        // Handle Greek letters
        text = text.replace(/\\alpha/g, 'α');
        text = text.replace(/\\beta/g, 'β');
        text = text.replace(/\\gamma/g, 'γ');
        text = text.replace(/\\delta/g, 'δ');
        text = text.replace(/\\epsilon/g, 'ε');
        text = text.replace(/\\theta/g, 'θ');
        text = text.replace(/\\lambda/g, 'λ');
        text = text.replace(/\\mu/g, 'μ');
        text = text.replace(/\\pi/g, 'π');
        text = text.replace(/\\sigma/g, 'σ');
        text = text.replace(/\\tau/g, 'τ');
        text = text.replace(/\\phi/g, 'φ');
        text = text.replace(/\\omega/g, 'ω');
        
        // Handle integrals (∫)
        text = text.replace(/∫/g, '<span class="integral">∫</span>');
        
        // Handle summations (Σ)
        text = text.replace(/Σ/g, '<span class="summation">Σ</span>');
        
        // Handle limits
        text = text.replace(/lim_(\w+→\w+)/g, '<span class="limit">lim<sub>$1</sub></span>');
        
        return text;
      };

      mathRef.current.innerHTML = renderMath(equation);
    }
  }, [equation]);

  return (
    <div 
      ref={mathRef} 
      className={`math-renderer ${className}`}
      style={{
        fontFamily: 'Times New Roman, serif',
        fontSize: '1.1em',
        lineHeight: '1.4'
      }}
    />
  );
};


