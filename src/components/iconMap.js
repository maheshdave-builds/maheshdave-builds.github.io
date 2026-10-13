import {
  Atom,
  Braces,
  Cloud,
  Code2,
  Container,
  Cpu,
  Database,
  GitBranch,
  Github,
  Globe,
  Layers,
  Linkedin,
  Mail,
  Rocket,
  Server,
  Share2,
  Wind,
  FileCode2,
} from 'lucide-react'

export const iconMap = {
  Atom,
  Braces,
  Cloud,
  Container,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  Github,
  Globe,
  Layers,
  Linkedin,
  Mail,
  Rocket,
  Server,
  Share2,
  Wind,
}

export function getIconByName(name) {
  return iconMap[name] ?? Code2
}
