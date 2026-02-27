import React, { useEffect, useRef, useState } from "react"
import DashboardLayout from "@/Layouts/DashboardLayout"
import { Card, CardContent } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import {
    Mail, Calendar, FileText, Globe, Calculator,
    ShoppingCart, BarChart, Users, Bell, Search,
    MessageCircle, Clock, PenTool, Handshake, Sparkles,
    Briefcase, BookOpen, Newspaper, MapPin, Mic,
} from "lucide-react"

const skills = [
    { name: "Email Manager", description: "Read, summarize, and draft replies to your emails", icon: Mail, color: "bg-blue-500/10 text-blue-600" },
    { name: "Meeting Scheduler", description: "Schedule and manage your meetings from chat", icon: Calendar, color: "bg-green-500/10 text-green-600" },
    { name: "Document Writer", description: "Create documents, reports, and presentations", icon: FileText, color: "bg-purple-500/10 text-purple-600" },
    { name: "Web Researcher", description: "Search the web and summarize findings", icon: Globe, color: "bg-orange-500/10 text-orange-600" },
    { name: "Budget Tracker", description: "Track expenses and manage your budget", icon: Calculator, color: "bg-emerald-500/10 text-emerald-600" },
    { name: "Shopping Assistant", description: "Find deals and compare products for you", icon: ShoppingCart, color: "bg-pink-500/10 text-pink-600" },
    { name: "Analytics Reporter", description: "Generate analytics reports from your data", icon: BarChart, color: "bg-indigo-500/10 text-indigo-600" },
    { name: "Team Coordinator", description: "Coordinate tasks and updates across your team", icon: Users, color: "bg-cyan-500/10 text-cyan-600" },
    { name: "Smart Reminders", description: "Set intelligent reminders that adapt to your schedule", icon: Bell, color: "bg-yellow-500/10 text-yellow-600" },
    { name: "Deep Search", description: "Search across all your files and conversations", icon: Search, color: "bg-red-500/10 text-red-600" },
    { name: "Social Media Manager", description: "Draft and schedule social media posts", icon: MessageCircle, color: "bg-violet-500/10 text-violet-600" },
    { name: "Time Tracker", description: "Track time spent on projects and tasks", icon: Clock, color: "bg-teal-500/10 text-teal-600" },
    { name: "Content Writer", description: "Write blog posts, articles, and marketing copy", icon: PenTool, color: "bg-rose-500/10 text-rose-600" },
    { name: "CRM Assistant", description: "Manage contacts and follow up with leads", icon: Handshake, color: "bg-amber-500/10 text-amber-600" },
    { name: "Daily Briefing", description: "Get a personalized morning briefing every day", icon: Newspaper, color: "bg-sky-500/10 text-sky-600" },
    { name: "Travel Planner", description: "Plan trips, find flights, and book hotels", icon: MapPin, color: "bg-lime-500/10 text-lime-600" },
    { name: "Voice Notes", description: "Transcribe and summarize voice messages", icon: Mic, color: "bg-fuchsia-500/10 text-fuchsia-600" },
    { name: "Project Manager", description: "Track project milestones and deliverables", icon: Briefcase, color: "bg-stone-500/10 text-stone-600" },
    { name: "Learning Coach", description: "Create study plans and quiz you on topics", icon: BookOpen, color: "bg-emerald-500/10 text-emerald-600" },
    { name: "AI Workflows", description: "Build custom multi-step AI automations", icon: Sparkles, color: "bg-blue-500/10 text-blue-600" },
]

// Split into two rows for the carousel
const row1 = skills.slice(0, 10)
const row2 = skills.slice(10, 20)

function SkillCard({ skill }: { skill: typeof skills[0] }) {
    const Icon = skill.icon
    return (
        <div className="flex-shrink-0 w-64">
            <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${skill.color}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{skill.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{skill.description}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function AutoScrollRow({ items, direction = "left", speed = 30 }: {
    items: typeof skills
    direction?: "left" | "right"
    speed?: number
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isPaused, setIsPaused] = useState(false)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        let animationId: number
        let position = direction === "left" ? 0 : -(el.scrollWidth / 2)

        const step = () => {
            if (!isPaused) {
                if (direction === "left") {
                    position -= 0.5
                    if (Math.abs(position) >= el.scrollWidth / 2) position = 0
                } else {
                    position += 0.5
                    if (position >= 0) position = -(el.scrollWidth / 2)
                }
                el.style.transform = `translateX(${position}px)`
            }
            animationId = requestAnimationFrame(step)
        }

        animationId = requestAnimationFrame(step)
        return () => cancelAnimationFrame(animationId)
    }, [isPaused, direction])

    // Double the items for seamless loop
    const doubled = [...items, ...items]

    return (
        <div
            className="overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div ref={scrollRef} className="flex gap-4 will-change-transform">
                {doubled.map((skill, i) => (
                    <SkillCard key={`${skill.name}-${i}`} skill={skill} />
                ))}
            </div>
        </div>
    )
}

function SkillsIndex() {
    return (
        <div className="max-w-5xl mx-auto w-full overflow-hidden">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
                    <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                    One-click install superpowers for your assistant. Skills are add-ons that give your assistant new abilities.
                </p>
            </div>

            <div className="space-y-4">
                <AutoScrollRow items={row1} direction="left" />
                <AutoScrollRow items={row2} direction="right" />
            </div>

            <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-5 py-2.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                        We're building the Skills marketplace. Stay tuned!
                    </span>
                </div>
            </div>
        </div>
    )
}

SkillsIndex.layout = (page: React.ReactNode) => <DashboardLayout title="Skills">{page}</DashboardLayout>

export default SkillsIndex
