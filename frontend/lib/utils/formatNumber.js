"use client";

/**
 * Format small numbers with subscript notation like DexScreener
 * Example: 0.0000000001 → 0.0₁₀1
 */
export const formatSmallNumber = (value) => {
    if (!value || value === '0' || value === 0) return '0';

    const num = parseFloat(value);
    if (isNaN(num)) return '0';

    // Valeurs normales (>= 0.01)
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.01) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);

    // Format notation subscript pour très petits nombres
    const str = num.toExponential();
    const [coefficient, exponent] = str.split('e');
    const exp = Math.abs(parseInt(exponent));

    // DexScreener format: 0.0₅8453
    const coef = parseFloat(coefficient).toFixed(4).replace(/\.?0+$/, '').replace('0.', '');
    const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    const expStr = (exp - 1).toString().split('').map(d => subscripts[parseInt(d)]).join('');

    return `0.0${expStr}${coef}`;
};

/**
 * Format ETH value with appropriate precision
 */
export const formatEth = (value) => {
    const formatted = formatSmallNumber(value);
    return `${formatted} Ξ`;
};

/**
 * Format percentage
 */
export const formatPercent = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0%';
    return `${num.toFixed(1)}%`;
};
