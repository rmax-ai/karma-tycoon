'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { useGameStore, TIER_THRESHOLDS, CandleData } from '@/store/useGameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Lock } from 'lucide-react';
import { getSafeChartScale, type ChartScale } from '@/lib/utils';

export const KpsChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const sma7SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma25SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const kpsHistory = useGameStore((state) => state.kpsHistory);
  const currentCandle = useGameStore((state) => state.currentCandle);
  const chartTimeframe = useGameStore((state) => state.chartTimeframe);
  const setChartTimeframe = useGameStore((state) => state.setChartTimeframe);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const chartIndicators = useGameStore((state) => state.chartIndicators);
  const toggleChartIndicator = useGameStore((state) => state.toggleChartIndicator);
  const [chartScale, setChartScale] = useState<ChartScale>({ scale: 1, formattedScale: '1' });

  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  const tier = currentTier.tier;

  const fullData = useMemo(() => {
    const data = [...kpsHistory];
    if (currentCandle) {
      data.push(currentCandle);
    }
    return data;
  }, [kpsHistory, currentCandle]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa', // zinc-400
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.3)' }, // zinc-800
        horzLines: { color: 'rgba(39, 39, 42, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: chartTimeframe < 60,
        borderColor: 'rgba(39, 39, 42, 0.5)',
      },
      rightPriceScale: {
        borderColor: 'rgba(39, 39, 42, 0.5)',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', // green-500
      downColor: '#ef4444', // red-500
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const sma7Series = tier >= 3 ? chart.addSeries(LineSeries, {
      color: '#3b82f6', // blue-500
      lineWidth: 2,
      title: 'SMA 7',
      visible: chartIndicators.sma7,
    }) : null;

    const sma25Series = tier >= 4 ? chart.addSeries(LineSeries, {
      color: '#f59e0b', // amber-500
      lineWidth: 2,
      title: 'SMA 25',
      visible: chartIndicators.sma25,
    }) : null;

    const volumeSeries = tier >= 2 ? chart.addSeries(HistogramSeries, {
      color: '#71717a', // zinc-500
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as overlay
      visible: chartIndicators.volume,
    }) : null;

    if (volumeSeries) {
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    sma7SeriesRef.current = sma7Series;
    sma25SeriesRef.current = sma25Series;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartTimeframe, tier]); // Re-init when tier changes to add new series

  // Handle Visibility Toggles
  useEffect(() => {
    if (sma7SeriesRef.current) {
      sma7SeriesRef.current.applyOptions({ visible: chartIndicators.sma7 && tier >= 3 });
    }
    if (sma25SeriesRef.current) {
      sma25SeriesRef.current.applyOptions({ visible: chartIndicators.sma25 && tier >= 4 });
    }
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: chartIndicators.volume && tier >= 2 });
    }
  }, [chartIndicators, tier]);

  // Update Data
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;
 
    const scaleCandidates = fullData.flatMap((d: CandleData) => [
      d.open,
      d.high,
      d.low,
      d.close,
      d.volume,
    ]);
    const { scale, formattedScale } = getSafeChartScale(scaleCandidates);
    setChartScale((prev: ChartScale) =>
      prev.scale === scale && prev.formattedScale === formattedScale
        ? prev
        : { scale, formattedScale }
    );
 
    const scaledCandles: CandlestickData[] = fullData.map((d: CandleData) => {
      const open = d.open / scale;
      const high = d.high / scale;
      const low = d.low / scale;
      const close = d.close / scale;
      return {
        time: d.time as any,
        open,
        high,
        low,
        close,
      };
    });
 
    candlestickSeriesRef.current.setData(scaledCandles);
 
    if (volumeSeriesRef.current && tier >= 2) {
      const volumeData: HistogramData[] = fullData.map((d: CandleData) => ({
        time: d.time as any,
        value: d.volume / scale,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
 
    const calculateSMA = (data: CandlestickData[], period: number) => {
      const sma: LineData[] = [];
      for (let i = period; i <= data.length; i++) {
        const slice = data.slice(i - period, i);
        const sum = slice.reduce((acc, val) => acc + val.close, 0);
        sma.push({ time: data[i - 1].time as any, value: sum / period });
      }
      return sma;
    };
 
    if (sma7SeriesRef.current && tier >= 3) {
      sma7SeriesRef.current.setData(calculateSMA(scaledCandles, 7));
    }
    if (sma25SeriesRef.current && tier >= 4) {
      sma25SeriesRef.current.setData(calculateSMA(scaledCandles, 25));
    }
 
  }, [fullData, tier]);

  return (
    <Card className="w-full overflow-hidden border-orange-500/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Market Analysis (KPS)
          </CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Real-time performance & technical indicators</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <div className="flex bg-muted/50 rounded-md p-1 gap-1">
            {[10, 30, 60, 300].map((seconds) => (
              <Button
                key={seconds}
                variant={chartTimeframe === seconds ? 'default' : 'ghost'}
                size="sm"
                disabled={tier < 5}
                className={`h-6 px-2 text-[10px] ${chartTimeframe === seconds ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                onClick={() => setChartTimeframe(seconds)}
              >
                {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={chartContainerRef} className="w-full" />
        <div className="flex items-center justify-between p-2 border-t border-orange-500/10 bg-muted/20">
          <div className="flex w-full items-center justify-around gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={tier < 3}
              onClick={() => toggleChartIndicator('sma7')}
              className={`h-7 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                tier < 3 ? 'opacity-30' : chartIndicators.sma7 ? 'text-blue-400' : 'text-muted-foreground'
              }`}
            >
              {tier >= 3 ? (
                <>
                  <div className={`w-2 h-2 rounded-full ${chartIndicators.sma7 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-600'}`} />
                  <span>SMA 7</span>
                </>
              ) : (
                <>
                  <Lock className="w-2 h-2" />
                  <span>Locked (T3)</span>
                </>
              )}
            </Button>
 
            <Button
              variant="ghost"
              size="sm"
              disabled={tier < 4}
              onClick={() => toggleChartIndicator('sma25')}
              className={`h-7 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                tier < 4 ? 'opacity-30' : chartIndicators.sma25 ? 'text-amber-400' : 'text-muted-foreground'
              }`}
            >
              {tier >= 4 ? (
                <>
                  <div className={`w-2 h-2 rounded-full ${chartIndicators.sma25 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-600'}`} />
                  <span>SMA 25</span>
                </>
              ) : (
                <>
                  <Lock className="w-2 h-2" />
                  <span>Locked (T4)</span>
                </>
              )}
            </Button>
 
            <Button
              variant="ghost"
              size="sm"
              disabled={tier < 2}
              onClick={() => toggleChartIndicator('volume')}
              className={`h-7 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                tier < 2 ? 'opacity-30' : chartIndicators.volume ? 'text-green-400' : 'text-muted-foreground'
              }`}
            >
              {tier >= 2 ? (
                <>
                  <div className={`w-2 h-2 rounded-full ${chartIndicators.volume ? 'bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-zinc-600'}`} />
                  <span>Volume</span>
                </>
              ) : (
                <>
                  <Lock className="w-2 h-2" />
                  <span>Locked (T2)</span>
                </>
              )}
            </Button>
          </div>
          <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Scale ×{chartScale.formattedScale}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
