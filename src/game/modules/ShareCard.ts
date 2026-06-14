import type { Achievement, GameStats, Rarity, CodexEntry } from '../types/game';
import { RARITY_COLORS, RARITY_NAMES } from '../types/game';
import { ACHIEVEMENT_CATEGORY_NAMES } from '../data/achievements';
import { CODEX_CATEGORY_NAMES } from '../data/codex';

export interface ShareCardData {
  type: 'achievement' | 'codex' | 'stats' | 'milestone';
  title: string;
  subtitle: string;
  icon: string;
  rarity?: Rarity;
  description?: string;
  stats?: Array<{ label: string; value: string | number }>;
  playerName?: string;
  timestamp?: number;
}

export interface ShareCardStyle {
  width: number;
  height: number;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}

const DEFAULT_STYLE: ShareCardStyle = {
  width: 400,
  height: 300,
  backgroundColor: '#1a1a2e',
  accentColor: '#ff9800',
  textColor: '#ffffff',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

export class ShareCardGenerator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  generateAchievementCard(achievement: Achievement, progress: number = 100): string | null {
    const data: ShareCardData = {
      type: 'achievement',
      title: achievement.name,
      subtitle: ACHIEVEMENT_CATEGORY_NAMES[achievement.category],
      icon: achievement.icon,
      rarity: achievement.rarity,
      description: achievement.description,
      stats: [
        { label: '完成度', value: `${Math.floor(progress)}%` }
      ],
      timestamp: Date.now()
    };

    return this.generateCard(data);
  }

  generateCodexCard(entry: CodexEntry): string | null {
    const data: ShareCardData = {
      type: 'codex',
      title: entry.name,
      subtitle: `${CODEX_CATEGORY_NAMES[entry.category]}图鉴`,
      icon: entry.icon,
      rarity: entry.rarity,
      description: entry.description,
      stats: [
        { label: '收集数量', value: entry.count }
      ],
      timestamp: Date.now()
    };

    return this.generateCard(data);
  }

  generateStatsCard(stats: GameStats, title: string = '我的农场数据'): string | null {
    const data: ShareCardData = {
      type: 'stats',
      title,
      subtitle: '农场经营报告',
      icon: '📊',
      stats: [
        { label: '总收获', value: stats.totalCropsHarvested },
        { label: '完成订单', value: stats.totalOrdersCompleted },
        { label: '累计金币', value: stats.totalCoinsEarned },
        { label: '游戏天数', value: stats.totalDaysPlayed }
      ],
      timestamp: Date.now()
    };

    return this.generateCard(data);
  }

  generateMilestoneCard(title: string, description: string, icon: string, stats: Array<{ label: string; value: string | number }>): string | null {
    const data: ShareCardData = {
      type: 'milestone',
      title,
      subtitle: '里程碑达成！',
      icon,
      description,
      stats,
      timestamp: Date.now()
    };

    return this.generateCard(data);
  }

  private generateCard(data: ShareCardData, style?: Partial<ShareCardStyle>): string | null {
    if (!this.ctx || !this.canvas) {
      return this.generateSVGCard(data, style);
    }

    const cardStyle = { ...DEFAULT_STYLE, ...style };
    const { width, height } = cardStyle;
    
    this.canvas.width = width;
    this.canvas.height = height;

    this.drawBackground(cardStyle);
    this.drawIcon(data.icon, cardStyle);
    this.drawRarityBadge(data.rarity, cardStyle);
    this.drawTitle(data.title, cardStyle);
    this.drawSubtitle(data.subtitle, cardStyle);
    
    if (data.description) {
      this.drawDescription(data.description, cardStyle);
    }
    
    if (data.stats && data.stats.length > 0) {
      this.drawStats(data.stats, cardStyle);
    }
    
    this.drawFooter(cardStyle);

    return this.canvas.toDataURL('image/png');
  }

  private drawBackground(style: ShareCardStyle) {
    if (!this.ctx) return;
    
    const gradient = this.ctx.createLinearGradient(0, 0, style.width, style.height);
    gradient.addColorStop(0, style.backgroundColor);
    gradient.addColorStop(1, this.shadeColor(style.backgroundColor, 20));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.roundRect(0, 0, style.width, style.height, 16);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.beginPath();
    this.ctx.arc(style.width - 50, 50, 80, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawIcon(icon: string, style: ShareCardStyle) {
    if (!this.ctx) return;
    
    this.ctx.font = '64px serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(icon, style.width / 2, 80);
  }

  private drawRarityBadge(rarity?: Rarity, style?: ShareCardStyle) {
    if (!this.ctx || !rarity || !style) return;

    const color = RARITY_COLORS[rarity];
    const name = RARITY_NAMES[rarity];
    
    const x = style.width - 80;
    const y = 24;
    const width = 64;
    const height = 28;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.roundRect(x, y, width, height, 14);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(name, x + width / 2, y + height / 2);
  }

  private drawTitle(title: string, style: ShareCardStyle) {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = style.textColor;
    this.ctx.font = 'bold 24px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    const maxWidth = style.width - 40;
    let displayTitle = title;
    
    if (this.ctx.measureText(title).width > maxWidth) {
      while (this.ctx.measureText(displayTitle + '...').width > maxWidth && displayTitle.length > 0) {
        displayTitle = displayTitle.slice(0, -1);
      }
      displayTitle += '...';
    }
    
    this.ctx.fillText(displayTitle, style.width / 2, 130);
  }

  private drawSubtitle(subtitle: string, style: ShareCardStyle) {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '14px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(subtitle, style.width / 2, 165);
  }

  private drawDescription(description: string, style: ShareCardStyle) {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '13px system-ui';
    this.ctx.textAlign = 'center';
    
    const maxWidth = style.width - 60;
    const lines = this.wrapText(description, maxWidth, '13px system-ui');
    const startY = 195;
    
    lines.slice(0, 2).forEach((line, i) => {
      this.ctx!.fillText(line, style.width / 2, startY + i * 20);
    });
  }

  private drawStats(stats: Array<{ label: string; value: string | number }>, style: ShareCardStyle) {
    if (!this.ctx || stats.length === 0) return;

    const startY = style.height - 80;
    const statWidth = style.width / stats.length;
    
    stats.forEach((stat, i) => {
      const x = statWidth * i + statWidth / 2;
      
      this.ctx!.fillStyle = style.accentColor;
      this.ctx!.font = 'bold 18px system-ui';
      this.ctx!.textAlign = 'center';
      this.ctx!.fillText(String(stat.value), x, startY);
      
      this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx!.font = '12px system-ui';
      this.ctx!.fillText(stat.label, x, startY + 22);
    });
  }

  private drawFooter(style: ShareCardStyle) {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '11px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🐔 像素农场 - 我的成就', style.width / 2, style.height - 20);
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    if (!this.ctx) return;
    
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private shadeColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }

  private wrapText(text: string, maxWidth: number, font: string): string[] {
    if (!this.ctx) return [text];
    
    this.ctx.font = font;
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private generateSVGCard(data: ShareCardData, style?: Partial<ShareCardStyle>): string | null {
    const cardStyle = { ...DEFAULT_STYLE, ...style };
    const { width, height } = cardStyle;
    const rarityColor = data.rarity ? RARITY_COLORS[data.rarity] : cardStyle.accentColor;
    const rarityName = data.rarity ? RARITY_NAMES[data.rarity] : '';

    let statsHtml = '';
    if (data.stats && data.stats.length > 0) {
      const statWidth = width / data.stats.length;
      statsHtml = data.stats.map((stat, i) => `
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 18px; font-weight: bold; color: ${rarityColor};">${stat.value}</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px;">${stat.label}</div>
        </div>
      `).join('');
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${cardStyle.backgroundColor}"/>
            <stop offset="100%" style="stop-color:#2d2d44"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" rx="16" fill="url(#bg)"/>
        <circle cx="${width - 50}" cy="50" r="80" fill="rgba(255,255,255,0.05)"/>
        
        <foreignObject x="0" y="0" width="${width}" height="${height}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
            font-family: ${cardStyle.fontFamily};
            color: ${cardStyle.textColor};
          ">
            ${data.rarity ? `
              <div style="
                align-self: flex-end;
                padding: 4px 12px;
                background: ${rarityColor};
                border-radius: 14px;
                font-size: 12px;
                font-weight: bold;
                color: white;
              ">${rarityName}</div>
            ` : ''}
            
            <div style="font-size: 64px; margin-top: -30px;">${data.icon}</div>
            
            <div style="
              font-size: 24px;
              font-weight: bold;
              margin-top: 10px;
              text-align: center;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 100%;
            ">${data.title}</div>
            
            <div style="
              font-size: 14px;
              color: rgba(255,255,255,0.6);
              margin-top: 6px;
            ">${data.subtitle}</div>
            
            ${data.description ? `
              <div style="
                font-size: 13px;
                color: rgba(255,255,255,0.8);
                margin-top: 16px;
                text-align: center;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              ">${data.description}</div>
            ` : ''}
            
            <div style="
              flex: 1;
              display: flex;
              align-items: flex-end;
              width: 100%;
              padding-bottom: 30px;
            ">
              ${statsHtml}
            </div>
            
            <div style="
              font-size: 11px;
              color: rgba(255,255,255,0.4);
              margin-top: auto;
            ">🐔 像素农场 - 我的成就</div>
          </div>
        </foreignObject>
      </svg>
    `;

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  downloadCard(dataUrl: string, filename: string = 'achievement-card.png') {
    if (typeof document === 'undefined') return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async shareCard(dataUrl: string, title: string, text: string): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;

    if (navigator.share && navigator.canShare) {
      try {
        const blob = await this.dataUrlToBlob(dataUrl);
        const file = new File([blob], 'card.png', { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            text,
            files: [file]
          });
          return true;
        }
      } catch (e) {
        console.log('Share failed:', e);
      }
    }

    if (navigator.clipboard) {
      try {
        const blob = await this.dataUrlToBlob(dataUrl);
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        return true;
      } catch (e) {
        console.log('Copy to clipboard failed:', e);
      }
    }

    return false;
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }
}

export const shareCardGenerator = new ShareCardGenerator();
