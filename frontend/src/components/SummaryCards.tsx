"use client";

interface SummaryCardsProps {
  totalCount?: number;
  todoCount: number;
  progressCount: number;
  completedCount: number;
  onHoldCount?: number;
  overdueCount?: number;
}

export function SummaryCards({
  totalCount,
  todoCount,
  progressCount,
  completedCount,
  overdueCount = 0,
}: SummaryCardsProps) {
  const actualTotal =
    totalCount !== undefined
      ? totalCount
      : todoCount + progressCount + completedCount;

  const cards = [
    {
      title: "Total Tasks",
      count: actualTotal,
      subtitle: "tasks total",
      icon: "📋",
      iconBg: "bg-gray-100",
      countColor: "text-gray-900",
      border: "border-gray-200",
    },
    {
      title: "In Progress",
      count: progressCount,
      subtitle: "in execution",
      icon: "⌛",
      iconBg: "bg-blue-50",
      countColor: "text-blue-600",
      border: "border-blue-100",
    },
    {
      title: "Completed",
      count: completedCount,
      subtitle: "done",
      icon: "☑️",
      iconBg: "bg-green-50",
      countColor: "text-green-600",
      border: "border-green-100",
    },
    {
      title: "Overdue",
      count: overdueCount,
      subtitle: "needs attention",
      icon: "⚠️",
      iconBg: "bg-red-50",
      countColor: "text-red-600",
      border: "border-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`flex h-[118px] items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm ${card.border}`}
        >
          <div>
            <p
              className={`text-xs font-medium ${
                card.title === "In Progress"
                  ? "text-blue-600"
                  : card.title === "Completed"
                  ? "text-green-600"
                  : card.title === "Overdue"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {card.title}
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold ${card.countColor}`}
              >
                {card.count}
              </span>

              <span className="text-xs text-gray-400">
                {card.subtitle}
              </span>
            </div>
          </div>

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm ${card.iconBg}`}
          >
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}