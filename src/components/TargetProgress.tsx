import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, TrendingUp, Target, Award, Briefcase, Pencil } from "lucide-react";
import confetti from "canvas-confetti";
import EditTargetDialog from "@/components/EditTargetDialog";
import TargetForm from "@/components/TargetForm";

interface Deal {
  id: string;
  client_type: "EQ" | "CFD";
  created_at: string;
  is_new_client: boolean;
}

interface MonthlyTarget {
  id: string;
  month: number;
  year: number;
  general_target_amount: number;
  cfd_target_amount: number;
  workdays_in_period?: number;
}

interface QuarterlyTarget {
  id: string;
  quarter: number;
  year: number;
  general_target_amount: number;
  cfd_target_amount: number;
  workdays_in_period?: number;
}

interface TargetProgressProps {
  deals: Deal[];
  monthlyTargets: MonthlyTarget[];
  quarterlyTargets: QuarterlyTarget[];
  onTargetUpdated: () => void;
  selectedYear: number;
  selectedMonth: number;
  userId: string;
}

const TargetProgress = ({ deals, monthlyTargets, quarterlyTargets, onTargetUpdated, selectedYear, selectedMonth, userId }: TargetProgressProps) => {
  const [targetFormOpen, setTargetFormOpen] = useState(false);
  const [congratsDialogOpen, setCongratsDialogOpen] = useState(false);
  const [congratsMessage, setCongratsMessage] = useState("");
  const [congratsSubMessage, setCongratsSubMessage] = useState("");
  const [hasPlayedMonthlyConfetti, setHasPlayedMonthlyConfetti] = useState(false);
  const [hasPlayedMonthlyConfettiCFD, setHasPlayedMonthlyConfettiCFD] = useState(false);
  const [hasPlayedQuarterlyConfetti, setHasPlayedQuarterlyConfetti] = useState(false);
  const [hasPlayedQuarterlyConfettiCFD, setHasPlayedQuarterlyConfettiCFD] = useState(false);
  const prevMonthlyPct = useRef(0);
  const prevMonthlyPctCFD = useRef(0);
  const prevQuarterlyPct = useRef(0);
  const prevQuarterlyPctCFD = useRef(0);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Calculate the quarter based on selected month
  const selectedQuarter = Math.ceil(selectedMonth / 3);
  const selectedQuarterYear = `${selectedYear}-${selectedQuarter}`;

  // Generate list of available quarters (last 8 quarters)
  const availableQuarters = useMemo(() => {
    const quarters = [];
    for (let i = 0; i < 8; i++) {
      const quarterIndex = currentQuarter - 1 - i;
      const year = currentYear + Math.floor(quarterIndex / 4);
      const quarter = ((quarterIndex % 4) + 4) % 4 + 1;
      quarters.push({
        value: `${year}-${quarter}`,
        label: `רבעון ${quarter}/${year}`,
        year,
        quarter,
      });
    }
    return quarters;
  }, [currentYear, currentQuarter]);

  const [selectedQuarterYearNum, selectedQuarterNum] = selectedQuarterYear.split('-').map(Number);

  // Calculate workdays in a period (excluding Friday and Saturday)
  const calculateWorkdays = (startDate: Date, endDate: Date): number => {
    let workdays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // 5 = Friday, 6 = Saturday
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        workdays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workdays;
  };

  const calculations = useMemo(() => {
    const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
    const isCurrentQuarter = selectedQuarterYearNum === currentYear && selectedQuarterNum === currentQuarter;

    // Calculate selected month workdays
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0);
    const selectedMonthWorkdays = calculateWorkdays(monthStart, monthEnd);
    
    // Calculate workdays passed so far (only for current month)
    const today = new Date();
    const monthWorkdaysPassed = isCurrentMonth ? calculateWorkdays(monthStart, today) : selectedMonthWorkdays;
    const monthWorkdaysRemaining = isCurrentMonth ? selectedMonthWorkdays - monthWorkdaysPassed : 0;

    // Calculate selected quarter workdays
    const quarterStartMonth = (selectedQuarterNum - 1) * 3;
    const quarterStart = new Date(selectedQuarterYearNum, quarterStartMonth, 1);
    const quarterEnd = new Date(selectedQuarterYearNum, quarterStartMonth + 3, 0);
    const selectedQuarterWorkdays = calculateWorkdays(quarterStart, quarterEnd);
    
    // Calculate workdays passed so far (only for current quarter)
    const quarterWorkdaysPassed = isCurrentQuarter ? calculateWorkdays(quarterStart, today) : selectedQuarterWorkdays;
    const quarterWorkdaysRemaining = isCurrentQuarter ? selectedQuarterWorkdays - quarterWorkdaysPassed : 0;

    // Get selected month's target
    const monthlyTarget = monthlyTargets.find(
      (t) => t.month === selectedMonth && t.year === selectedYear
    );

    // Get selected quarter's target
    const quarterlyTarget = quarterlyTargets.find(
      (t) => t.quarter === selectedQuarterNum && t.year === selectedQuarterYearNum
    );

    // Count deals for selected month (deals are already filtered by parent)
    const monthlyDeals = deals.filter((deal) => deal.is_new_client);

    // Count deals for selected quarter
    const quarterlyDeals = deals.filter((deal) => {
      const dealDate = new Date(deal.created_at);
      const dealMonth = dealDate.getMonth() + 1;
      const quarterDealStartMonth = (selectedQuarterNum - 1) * 3 + 1;
      return (
        dealMonth >= quarterDealStartMonth &&
        dealMonth < quarterDealStartMonth + 3 &&
        dealDate.getFullYear() === selectedQuarterYearNum &&
        deal.is_new_client
      );
    });

    const monthlyTotalCount = monthlyDeals.length;
    const monthlyCFDCount = monthlyDeals.filter((d) => d.client_type === "CFD").length;
    const monthlyPercentage = monthlyTarget
      ? (monthlyTotalCount / monthlyTarget.general_target_amount) * 100
      : 0;
    const monthlyCFDPercentage = monthlyTarget
      ? (monthlyCFDCount / monthlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate monthly projection (only for current month)
    const monthlyDailyRate = monthWorkdaysPassed > 0 ? monthlyTotalCount / monthWorkdaysPassed : 0;
    const monthlyCFDDailyRate = monthWorkdaysPassed > 0 ? monthlyCFDCount / monthWorkdaysPassed : 0;
    const monthlyProjectedTotal = isCurrentMonth && monthWorkdaysPassed > 0 
      ? Math.round(monthlyTotalCount + (monthlyDailyRate * monthWorkdaysRemaining))
      : 0;
    const monthlyProjectedCFD = isCurrentMonth && monthWorkdaysPassed > 0
      ? Math.round(monthlyCFDCount + (monthlyCFDDailyRate * monthWorkdaysRemaining))
      : 0;
    const monthlyProjectedPercentage = monthlyTarget
      ? (monthlyProjectedTotal / monthlyTarget.general_target_amount) * 100
      : 0;
    const monthlyProjectedCFDPercentage = monthlyTarget
      ? (monthlyProjectedCFD / monthlyTarget.cfd_target_amount) * 100
      : 0;

    const quarterlyTotalCount = quarterlyDeals.length;
    const quarterlyCFDCount = quarterlyDeals.filter((d) => d.client_type === "CFD").length;
    const quarterlyPercentage = quarterlyTarget
      ? (quarterlyTotalCount / quarterlyTarget.general_target_amount) * 100
      : 0;
    const quarterlyCFDPercentage = quarterlyTarget
      ? (quarterlyCFDCount / quarterlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate quarterly projection (only for current quarter)
    const quarterlyDailyRate = quarterWorkdaysPassed > 0 ? quarterlyTotalCount / quarterWorkdaysPassed : 0;
    const quarterlyCFDDailyRate = quarterWorkdaysPassed > 0 ? quarterlyCFDCount / quarterWorkdaysPassed : 0;
    const quarterlyProjectedTotal = isCurrentQuarter && quarterWorkdaysPassed > 0
      ? Math.round(quarterlyTotalCount + (quarterlyDailyRate * quarterWorkdaysRemaining))
      : 0;
    const quarterlyProjectedCFD = isCurrentQuarter && quarterWorkdaysPassed > 0
      ? Math.round(quarterlyCFDCount + (quarterlyCFDDailyRate * quarterWorkdaysRemaining))
      : 0;
    const quarterlyProjectedPercentage = quarterlyTarget
      ? (quarterlyProjectedTotal / quarterlyTarget.general_target_amount) * 100
      : 0;
    const quarterlyProjectedCFDPercentage = quarterlyTarget
      ? (quarterlyProjectedCFD / quarterlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate monthly bonuses
    let monthlyBonus = 0;
    if (monthlyTarget) {
      // General target bonus
      if (monthlyPercentage >= 100) {
        monthlyBonus += 2000;
      } else if (monthlyPercentage >= 90) {
        monthlyBonus += 1000;
      }

      // CFD specific bonus
      if (monthlyCFDPercentage >= 100) {
        monthlyBonus += 1000;
      } else if (monthlyCFDPercentage >= 90) {
        monthlyBonus += 500;
      }

      // 70% bonus (valid until 30.9.25)
      const validUntil = new Date(2025, 8, 30); // September 30, 2025
      if (now <= validUntil && monthlyPercentage >= 70) {
        monthlyBonus += 2000;
      }
    }

    // Calculate projected monthly bonus (based on projected percentages)
    let monthlyProjectedBonus = 0;
    if (monthlyTarget && isCurrentMonth && monthWorkdaysPassed > 0) {
      // General target bonus
      if (monthlyProjectedPercentage >= 100) {
        monthlyProjectedBonus += 2000;
      } else if (monthlyProjectedPercentage >= 90) {
        monthlyProjectedBonus += 1000;
      }

      // CFD specific bonus
      if (monthlyProjectedCFDPercentage >= 100) {
        monthlyProjectedBonus += 1000;
      } else if (monthlyProjectedCFDPercentage >= 90) {
        monthlyProjectedBonus += 500;
      }

      // 70% bonus (valid until 30.9.25)
      const validUntil = new Date(2025, 8, 30); // September 30, 2025
      if (now <= validUntil && monthlyProjectedPercentage >= 70) {
        monthlyProjectedBonus += 2000;
      }
    }

    // Calculate quarterly bonuses (starts from July 2025)
    let quarterlyBonus = 0;
    const quarterlyStartDate = new Date(2025, 6, 1); // July 1, 2025
    if (quarterlyTarget && now >= quarterlyStartDate) {
      // General target bonus
      if (quarterlyPercentage >= 100) {
        quarterlyBonus += 6000;
      } else if (quarterlyPercentage >= 90) {
        quarterlyBonus += 3000;
      }

      // CFD specific bonus
      if (quarterlyCFDPercentage >= 100) {
        quarterlyBonus += 3000;
      } else if (quarterlyCFDPercentage >= 90) {
        quarterlyBonus += 1500;
      }
    }

    // Calculate projected quarterly bonus (based on projected percentages)
    let quarterlyProjectedBonus = 0;
    if (quarterlyTarget && now >= quarterlyStartDate && isCurrentQuarter && quarterWorkdaysPassed > 0) {
      // General target bonus
      if (quarterlyProjectedPercentage >= 100) {
        quarterlyProjectedBonus += 6000;
      } else if (quarterlyProjectedPercentage >= 90) {
        quarterlyProjectedBonus += 3000;
      }

      // CFD specific bonus
      if (quarterlyProjectedCFDPercentage >= 100) {
        quarterlyProjectedBonus += 3000;
      } else if (quarterlyProjectedCFDPercentage >= 90) {
        quarterlyProjectedBonus += 1500;
      }
    }

    return {
      monthly: {
        target: monthlyTarget,
        totalCount: monthlyTotalCount,
        cfdCount: monthlyCFDCount,
        totalPercentage: Math.min(monthlyPercentage, 100),
        cfdPercentage: Math.min(monthlyCFDPercentage, 100),
        bonus: monthlyBonus,
        projectedBonus: monthlyProjectedBonus,
        workdays: monthlyTarget?.workdays_in_period || selectedMonthWorkdays,
        workdaysPassed: monthWorkdaysPassed,
        workdaysRemaining: monthWorkdaysRemaining,
        projectedTotal: monthlyProjectedTotal,
        projectedCFD: monthlyProjectedCFD,
        projectedPercentage: Math.min(monthlyProjectedPercentage, 100),
        projectedCFDPercentage: Math.min(monthlyProjectedCFDPercentage, 100),
        dailyRate: monthlyDailyRate,
        isCurrentPeriod: isCurrentMonth,
      },
      quarterly: {
        target: quarterlyTarget,
        totalCount: quarterlyTotalCount,
        cfdCount: quarterlyCFDCount,
        totalPercentage: Math.min(quarterlyPercentage, 100),
        cfdPercentage: Math.min(quarterlyCFDPercentage, 100),
        bonus: quarterlyBonus,
        projectedBonus: quarterlyProjectedBonus,
        workdays: quarterlyTarget?.workdays_in_period || selectedQuarterWorkdays,
        workdaysPassed: quarterWorkdaysPassed,
        workdaysRemaining: quarterWorkdaysRemaining,
        projectedTotal: quarterlyProjectedTotal,
        projectedCFD: quarterlyProjectedCFD,
        projectedPercentage: Math.min(quarterlyProjectedPercentage, 100),
        projectedCFDPercentage: Math.min(quarterlyProjectedCFDPercentage, 100),
        dailyRate: quarterlyDailyRate,
        isCurrentPeriod: isCurrentQuarter,
      },
    };
  }, [deals, monthlyTargets, quarterlyTargets, selectedYear, selectedMonth, selectedQuarterYearNum, selectedQuarterNum, currentYear, currentMonth, currentQuarter]);

  // Reset confetti flags when changing period selection
  useEffect(() => {
    setHasPlayedMonthlyConfetti(false);
    setHasPlayedMonthlyConfettiCFD(false);
    setHasPlayedQuarterlyConfetti(false);
    setHasPlayedQuarterlyConfettiCFD(false);
    prevMonthlyPct.current = 0;
    prevMonthlyPctCFD.current = 0;
    prevQuarterlyPct.current = 0;
    prevQuarterlyPctCFD.current = 0;
  }, [selectedMonth, selectedYear]);

  // Play confetti and sound when target is reached (on crossing 100%)
  useEffect(() => {
    const playApplause = () => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioCtx();
        
        // Trumpet fanfare
        const fanfareNotes = [
          { freq: 523.25, time: 0, duration: 0.2 },     // C5
          { freq: 659.25, time: 0.2, duration: 0.2 },   // E5
          { freq: 783.99, time: 0.4, duration: 0.25 },  // G5
          { freq: 1046.5, time: 0.65, duration: 0.4 },  // C6
        ];

        fanfareNotes.forEach(note => {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'triangle';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0.001, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.5, audioContext.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.duration);
            osc.start();
            osc.stop(audioContext.currentTime + note.duration);
          }, note.time * 1000);
        });

        // Massive crowd applause and cheering - much longer and louder
        const createApplauseNoise = (startTime: number, duration: number, volume: number) => {
          setTimeout(() => {
            const bufferSize = audioContext.sampleRate * duration;
            const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
            
            // Create stereo applause with more variation
            for (let channel = 0; channel < 2; channel++) {
              const data = buffer.getChannelData(channel);
              for (let i = 0; i < bufferSize; i++) {
                // Mix of different noise patterns for realistic applause
                const white = Math.random() * 2 - 1;
                const brown = (i > 0 ? data[i-1] * 0.9 : 0) + white * 0.1;
                data[i] = brown * (0.7 + Math.random() * 0.3); // Add variation
              }
            }
            
            const noise = audioContext.createBufferSource();
            const noiseGain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            noise.buffer = buffer;
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            
            // Band-pass filter for more realistic crowd sound
            filter.type = 'bandpass';
            filter.frequency.value = 1000;
            filter.Q.value = 1.5;
            
            // Envelope for natural applause sound
            noiseGain.gain.setValueAtTime(0.001, audioContext.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.1);
            noiseGain.gain.setValueAtTime(volume, audioContext.currentTime + duration * 0.7);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            noise.start();
          }, startTime * 1000);
        };

        // Create multiple overlapping applause layers for thickness
        createApplauseNoise(0, 3.5, 0.3);      // Main applause
        createApplauseNoise(0.1, 3.4, 0.25);   // Layer 2
        createApplauseNoise(0.2, 3.3, 0.2);    // Layer 3
        createApplauseNoise(0.3, 3.2, 0.15);   // Layer 4
        
        // Add cheering bursts
        [0.5, 1.2, 2.0, 2.8].forEach(time => {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'sawtooth';
            osc.frequency.value = 200 + Math.random() * 300;
            gain.gain.setValueAtTime(0.001, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            osc.start();
            osc.stop(audioContext.currentTime + 0.3);
          }, time * 1000);
        });
        
      } catch (e) {
        console.log('Audio API not available', e);
      }
    };

    const fireConfetti = () => {
      const duration = 5000; // 5 seconds!
      const animationEnd = Date.now() + duration;
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
      
      const defaults = { 
        startVelocity: 45, 
        spread: 360, 
        ticks: 80, 
        zIndex: 2000,
        colors: colors
      } as any;
      
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      
      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        
        const particleCount = 100 * (timeLeft / duration); // Way more particles!
        
        // Multiple confetti bursts from different positions
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.2), y: 0.1 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.4, 0.6), y: 0.1 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.8, 0.9), y: 0.1 } });
        
        // Occasional big bursts
        if (Math.random() > 0.7) {
          confetti({
            ...defaults,
            particleCount: 150,
            origin: { x: 0.5, y: 0.3 },
            spread: 180,
            startVelocity: 60
          });
        }
      }, 150);
      
      // Initial massive burst
      confetti({
        particleCount: 200,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
        zIndex: 2000
      });
    };

    const mp = calculations.monthly.totalPercentage;
    const mpCFD = calculations.monthly.cfdPercentage;
    const qp = calculations.quarterly.totalPercentage;
    const qpCFD = calculations.quarterly.cfdPercentage;

    const crossedMonthly = mp >= 100 && prevMonthlyPct.current < 100 && !!calculations.monthly.target;
    const crossedMonthlyCFD = mpCFD >= 100 && prevMonthlyPctCFD.current < 100 && !!calculations.monthly.target;
    const crossedQuarterly = qp >= 100 && prevQuarterlyPct.current < 100 && !!calculations.quarterly.target;
    const crossedQuarterlyCFD = qpCFD >= 100 && prevQuarterlyPctCFD.current < 100 && !!calculations.quarterly.target;

    console.log('Confetti check', { mp, mpCFD, qp, qpCFD, crossedMonthly, crossedMonthlyCFD, crossedQuarterly, crossedQuarterlyCFD });

    if (crossedMonthly && !hasPlayedMonthlyConfetti) {
      setHasPlayedMonthlyConfetti(true);
      
      // Check if CFD target is also reached (regardless of when it was reached)
      if (mpCFD >= 100) {
        setCongratsMessage("כל הכבוד! הגעת לכל היעדים החודשיים שלך! 🎉🏆");
        setCongratsSubMessage("אתה יכול ללכת לים! 🌊☀️");
      } else {
        setCongratsMessage("כל הכבוד! הגעת ליעד הכללי החודשי שלך! 🎉");
        const remaining = calculations.monthly.target!.cfd_target_amount - calculations.monthly.cfdCount;
        setCongratsSubMessage(`נשאר לך עוד ${remaining} לקוחות CFD כדי להגיע ליעד CFD החודשי! 💪`);
      }
      
      setCongratsDialogOpen(true);
      fireConfetti();
      playApplause();
    }

    if (crossedMonthlyCFD && !hasPlayedMonthlyConfettiCFD) {
      setHasPlayedMonthlyConfettiCFD(true);
      
      // Check if general target is also reached (regardless of when it was reached)
      if (mp >= 100) {
        setCongratsMessage("כל הכבוד! הגעת לכל היעדים החודשיים שלך! 🎉🏆");
        setCongratsSubMessage("אתה יכול ללכת לים! 🌊☀️");
      } else {
        setCongratsMessage("כל הכבוד! הגעת ליעד CFD החודשי שלך! 🎉");
        const remaining = calculations.monthly.target!.general_target_amount - calculations.monthly.totalCount;
        setCongratsSubMessage(`נשאר לך עוד ${remaining} לקוחות כדי להגיע ליעד הכללי החודשי! 💪`);
      }
      
      setCongratsDialogOpen(true);
      fireConfetti();
      playApplause();
    }

    if (crossedQuarterly && !hasPlayedQuarterlyConfetti) {
      setHasPlayedQuarterlyConfetti(true);
      
      // Check if CFD target is also reached (regardless of when it was reached)
      if (qpCFD >= 100) {
        setCongratsMessage("כל הכבוד! הגעת לכל היעדים הרבעוניים שלך! 🎊🏆");
        setCongratsSubMessage("אתה יכול ללכת לים! 🌊☀️");
      } else {
        setCongratsMessage("כל הכבוד! הגעת ליעד הכללי הרבעוני שלך! 🎊");
        const remaining = calculations.quarterly.target!.cfd_target_amount - calculations.quarterly.cfdCount;
        setCongratsSubMessage(`נשאר לך עוד ${remaining} לקוחות CFD כדי להגיע ליעד CFD הרבעוני! 💪`);
      }
      
      setCongratsDialogOpen(true);
      fireConfetti();
      playApplause();
    }

    if (crossedQuarterlyCFD && !hasPlayedQuarterlyConfettiCFD) {
      setHasPlayedQuarterlyConfettiCFD(true);
      
      // Check if general target is also reached (regardless of when it was reached)
      if (qp >= 100) {
        setCongratsMessage("כל הכבוד! הגעת לכל היעדים הרבעוניים שלך! 🎊🏆");
        setCongratsSubMessage("אתה יכול ללכת לים! 🌊☀️");
      } else {
        setCongratsMessage("כל הכבוד! הגעת ליעד CFD הרבעוני שלך! 🎊");
        const remaining = calculations.quarterly.target!.general_target_amount - calculations.quarterly.totalCount;
        setCongratsSubMessage(`נשאר לך עוד ${remaining} לקוחות כדי להגיע ליעד הכללי הרבעוני! 💪`);
      }
      
      setCongratsDialogOpen(true);
      fireConfetti();
      playApplause();
    }

    prevMonthlyPct.current = mp;
    prevMonthlyPctCFD.current = mpCFD;
    prevQuarterlyPct.current = qp;
    prevQuarterlyPctCFD.current = qpCFD;
  }, [calculations, hasPlayedMonthlyConfetti, hasPlayedMonthlyConfettiCFD, hasPlayedQuarterlyConfetti, hasPlayedQuarterlyConfettiCFD]);

  return (
    <>
      <Dialog open={congratsDialogOpen} onOpenChange={setCongratsDialogOpen}>
        <DialogContent className="sm:max-w-lg border-2 border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background shadow-2xl" dir="rtl">
          <DialogHeader className="space-y-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl animate-pulse" />
              <DialogTitle className="relative text-4xl font-extrabold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent leading-relaxed py-2 text-center">
                {congratsMessage}
              </DialogTitle>
            </div>
            <DialogDescription className="text-2xl font-semibold text-foreground/90 text-center">
              עבודה מצוינת! המשך כך! 💪✨
            </DialogDescription>
          </DialogHeader>
          
          {congratsSubMessage && (
            <div className="mt-2 p-4 rounded-lg bg-muted/50 border border-primary/30 text-center">
              <p className="text-lg font-medium text-primary">
                {congratsSubMessage}
              </p>
            </div>
          )}
          
          <div className="flex justify-center items-center gap-4 my-8">
            <div className="text-7xl animate-bounce" style={{ animationDuration: '0.6s' }}>
              🏆
            </div>
            <div className="text-6xl animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.1s' }}>
              🎉
            </div>
            <div className="text-7xl animate-bounce" style={{ animationDuration: '0.7s', animationDelay: '0.2s' }}>
              🎊
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-lg font-medium text-primary">
              אתה מדהים! 🌟
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className={!calculations.monthly.target ? "cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed" : ""}
          onClick={() => !calculations.monthly.target && setTargetFormOpen(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">יעד חודשי</CardTitle>
              </div>
              {calculations.monthly.target && (
                <EditTargetDialog
                  targetId={calculations.monthly.target.id}
                  targetType="monthly"
                  currentGeneralTarget={calculations.monthly.target.general_target_amount}
                  currentCfdTarget={calculations.monthly.target.cfd_target_amount}
                  currentWorkdays={calculations.monthly.target.workdays_in_period}
                  period="חודשי"
                  onTargetUpdated={onTargetUpdated}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4" dir="rtl">
          {calculations.monthly.target ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ימי עבודה</p>
                  <p className="text-xl font-bold">{calculations.monthly.workdays}</p>
                  <div className="mt-1 text-xs text-muted-foreground text-right space-y-0.5">
                    <div>עברו {calculations.monthly.workdaysPassed}</div>
                    <div>נותרו {calculations.monthly.workdaysRemaining}</div>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">מענק ליעד</p>
                  <p className="text-xl font-bold text-green-600">₪{calculations.monthly.bonus.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">התקדמות נוכחית</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד כללי (EQ + CFD)</span>
                      <span className="text-sm font-bold">
                        {calculations.monthly.totalCount} / {calculations.monthly.target.general_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.monthly.totalPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.monthly.totalPercentage.toFixed(0)}%</span>
                      {calculations.monthly.totalPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד CFD</span>
                      <span className="text-sm font-bold">
                        {calculations.monthly.cfdCount} / {calculations.monthly.target.cfd_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.monthly.cfdPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.monthly.cfdPercentage.toFixed(0)}%</span>
                      {calculations.monthly.cfdPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">תחזית לסוף התקופה (קצב: {calculations.monthly.dailyRate.toFixed(1)}/יום)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד כללי צפוי</p>
                    <p className="text-lg font-bold">{calculations.monthly.projectedTotal}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.monthly.projectedPercentage.toFixed(0)}%</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד CFD צפוי</p>
                    <p className="text-lg font-bold">{calculations.monthly.projectedCFD}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.monthly.projectedCFDPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">לא הוגדר יעד חודשי</p>
              <p className="text-sm text-muted-foreground">לחץ כאן להוספת יעד</p>
            </div>
          )}
          </CardContent>
        </Card>

      <Card
        className={!calculations.quarterly.target ? "cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed" : ""}
        onClick={() => !calculations.quarterly.target && setTargetFormOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">יעד רבעוני - רבעון {selectedQuarterNum}/{selectedQuarterYearNum}</CardTitle>
            </div>
            {calculations.quarterly.target && (
              <EditTargetDialog
                targetId={calculations.quarterly.target.id}
                targetType="quarterly"
                currentGeneralTarget={calculations.quarterly.target.general_target_amount}
                currentCfdTarget={calculations.quarterly.target.cfd_target_amount}
                currentWorkdays={calculations.quarterly.target.workdays_in_period}
                period="רבעוני"
                onTargetUpdated={onTargetUpdated}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          {calculations.quarterly.target ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ימי עבודה</p>
                  <p className="text-xl font-bold">{calculations.quarterly.workdays}</p>
                  <div className="mt-1 text-xs text-muted-foreground text-right space-y-0.5">
                    <div>עברו {calculations.quarterly.workdaysPassed}</div>
                    <div>נותרו {calculations.quarterly.workdaysRemaining}</div>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">מענק ליעד</p>
                  <p className="text-xl font-bold text-green-600">₪{calculations.quarterly.bonus.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">התקדמות נוכחית</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד כללי (EQ + CFD)</span>
                      <span className="text-sm font-bold">
                        {calculations.quarterly.totalCount} / {calculations.quarterly.target.general_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.quarterly.totalPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.quarterly.totalPercentage.toFixed(0)}%</span>
                      {calculations.quarterly.totalPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד CFD</span>
                      <span className="text-sm font-bold">
                        {calculations.quarterly.cfdCount} / {calculations.quarterly.target.cfd_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.quarterly.cfdPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.quarterly.cfdPercentage.toFixed(0)}%</span>
                      {calculations.quarterly.cfdPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">תחזית לסוף התקופה (קצב: {calculations.quarterly.dailyRate.toFixed(1)}/יום)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד כללי צפוי</p>
                    <p className="text-lg font-bold">{calculations.quarterly.projectedTotal}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.quarterly.projectedPercentage.toFixed(0)}%</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד CFD צפוי</p>
                    <p className="text-lg font-bold">{calculations.quarterly.projectedCFD}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.quarterly.projectedCFDPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">לא הוגדר יעד רבעוני</p>
              <p className="text-sm text-muted-foreground">לחץ כאן להוספת יעד</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <TargetForm
      userId={userId}
      onTargetAdded={onTargetUpdated}
      open={targetFormOpen}
      onOpenChange={setTargetFormOpen}
    />
  </>
  );
};

export default TargetProgress;