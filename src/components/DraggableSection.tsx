import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";

interface DraggableSectionProps {
  id: string;
  children: ReactNode;
}

const DraggableSection = ({ id, children }: DraggableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative group cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div
        className="absolute -right-3 top-4 z-20 bg-primary/10 rounded-lg p-2 shadow-md border border-primary/20 pointer-events-none"
        title="גרור לשינוי סדר"
      >
        <GripVertical className="h-5 w-5 text-primary" />
      </div>
      {children}
    </div>
  );
};

export default DraggableSection;
