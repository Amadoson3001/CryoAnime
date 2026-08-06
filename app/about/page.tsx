import {
    Container,
    Flex,
    Box,
    Text,
    Card,
    Grid,
    Badge,
    Button,
} from '@/components/ui-primitives'
import {
    Github,
    Code,
    Palette,
    Database,
    Globe,
    Mail,
    MapPin,
    Calendar,
    Star,
    GitBranch,
    Users
} from 'lucide-react'

const AboutPage = () => {
    const skills = [
        { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'CSS', 'Accessible UI'] },
        { category: 'Backend', items: ['Node.js', 'Express', 'Python', 'PostgreSQL', 'MongoDB'] },
        { category: 'Tools', items: ['Git', 'Docker', 'AWS', 'Vercel', 'Figma'] },
        { category: 'Design', items: ['UI/UX Design', 'Responsive Design', 'Animation', 'Prototyping'] }
    ]

    const stats = [
        { icon: GitBranch, label: 'Repositories', value: '50+' },
        { icon: Star, label: 'Stars', value: '200+' },
        { icon: Users, label: 'Contributors', value: '15+' },
        { icon: Code, label: 'Lines of Code', value: '100K+' }
    ]

    return (
        <>
            <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
                {/* Hero Section */}
                <Box
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        padding: '4rem 0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Animation */}
                    <Box
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                            animation: 'float 6s ease-in-out infinite'
                        }}
                    />

                    <Container size="4" px="4">
                        <Flex direction="column" align="center" gap="6" style={{ position: 'relative', zIndex: 1 }}>
                            {/* Profile Image */}
                            <Box
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
                                    animation: 'pulse 3s ease-in-out infinite'
                                }}
                            >
                                <Text size="8" weight="bold" style={{ color: 'white' }}>
                                    MT
                                </Text>
                            </Box>

                            {/* Name and Title */}
                            <Box style={{ textAlign: 'center' }}>
                                <h1
                                    style={{
                                        fontSize: 'var(--font-size-9)',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        margin: '0 0 1rem 0',
                                        animation: 'slideUp 1s ease-out'
                                    }}
                                >
                                    Mtechsin
                                </h1>
                                <Text
                                    size="5"
                                    style={{
                                        color: '#60a5fa',
                                        animation: 'slideUp 1s ease-out 0.2s both'
                                    }}
                                >
                                    Full-Stack Developer & UI/UX Designer
                                </Text>
                            </Box>

                            {/* Bio */}
                            <Box style={{ maxWidth: '600px', textAlign: 'center', animation: 'slideUp 1s ease-out 0.4s both' }}>
                                <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                    Passionate developer with expertise in modern web technologies.
                                    I create beautiful, functional, and user-centered digital experiences.
                                    Always learning, always building, always pushing the boundaries of what&apos;s possible.
                                </Text>
                            </Box>

                            {/* Contact Info */}
                            <Flex gap="4" wrap="wrap" justify="center" style={{ animation: 'slideUp 1s ease-out 0.6s both' }}>
                                <Flex align="center" gap="2">
                                    <Mail size={18} style={{ color: '#60a5fa' }} />
                                    <Text size="3" style={{ color: '#cbd5e1' }}>amadoson3001@gmail.com</Text>
                                </Flex>
                                <Flex align="center" gap="2">
                                    <MapPin size={18} style={{ color: '#60a5fa' }} />
                                    <Text size="3" style={{ color: '#cbd5e1' }}>Remote / Worldwide</Text>
                                </Flex>
                                <Flex align="center" gap="2">
                                    <Calendar size={18} style={{ color: '#60a5fa' }} />
                                    <Text size="3" style={{ color: '#cbd5e1' }}>Available for projects</Text>
                                </Flex>
                            </Flex>

                            {/* CTA Buttons */}
                            <Flex gap="4" style={{ animation: 'slideUp 1s ease-out 0.8s both' }}>
                                <Button asChild
                                    size="3"
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <a href="https://github.com/Mtechsin" target="_blank" rel="noopener noreferrer">
                                        <Github size={18} style={{ marginRight: '0.5rem' }} />
                                        View GitHub
                                    </a>
                                </Button>
                                <Button asChild
                                    size="3"
                                    variant="outline"
                                    style={{
                                        borderColor: '#3b82f6',
                                        color: '#3b82f6',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <a href="mailto:amadoson3001@gmail.com">
                                        <Mail size={18} style={{ marginRight: '0.5rem' }} />
                                        Get In Touch
                                    </a>
                                </Button>
                            </Flex>
                        </Flex>
                    </Container>
                </Box>

                {/* Stats Section */}
                <Container size="4" px="4" py="8" className="page-enter">
                    <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4" mb="8">
                        {stats.map((stat, index) => (
                            <Card
                                key={stat.label}
                                style={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    animation: `slideUp 1s ease-out ${index * 0.1 + 1}s both`
                                }}
                            >
                                <stat.icon size={32} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                                <Text size="6" weight="bold" style={{ color: 'white', display: 'block' }}>
                                    {stat.value}
                                </Text>
                                <Text size="3" style={{ color: '#94a3b8' }}>
                                    {stat.label}
                                </Text>
                            </Card>
                        ))}
                    </Grid>
                </Container>

                {/* Skills Section */}
                <Container size="4" px="4" py="8">
                    <Box mb="8" style={{ textAlign: 'center' }}>
                        <h2
                            style={{
                                fontSize: 'var(--font-size-8)',
                                fontWeight: 'bold',
                                color: 'white',
                                margin: '0 0 1rem 0',
                                animation: 'slideUp 1s ease-out'
                            }}
                        >
                            Skills & Technologies
                        </h2>
                        <Text size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
                            A comprehensive toolkit for building modern web applications
                        </Text>
                    </Box>

                    <Grid columns={{ initial: '1', md: '2' }} gap="6">
                        {skills.map((skillGroup, index) => (
                            <Card
                                key={skillGroup.category}
                                style={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    padding: '2rem',
                                    animation: `slideUp 1s ease-out ${index * 0.2 + 1.2}s both`
                                }}
                            >
                                <Text
                                    size="5"
                                    weight="bold"
                                    style={{
                                        color: '#3b82f6',
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {skillGroup.category === 'Frontend' && <Globe size={20} />}
                                    {skillGroup.category === 'Backend' && <Database size={20} />}
                                    {skillGroup.category === 'Tools' && <Code size={20} />}
                                    {skillGroup.category === 'Design' && <Palette size={20} />}
                                    {skillGroup.category}
                                </Text>
                                <Flex gap="2" wrap="wrap">
                                    {skillGroup.items.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="soft"
                                            style={{
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                color: '#60a5fa',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                transition: 'all 0.3s ease',
                                                cursor: 'default'
                                            }}
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </Flex>
                            </Card>
                        ))}
                    </Grid>
                </Container>


                {/* Call to Action */}
                <Container size="4" px="4" py="8">
                    <Card
                        style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            border: '1px solid #3b82f6',
                            padding: '3rem',
                            textAlign: 'center',
                            animation: 'slideUp 1s ease-out 1.8s both'
                        }}
                    >
                        <h3
                            style={{
                                fontSize: 'var(--font-size-7)',
                                fontWeight: 'bold',
                                color: 'white',
                                margin: '0 0 1rem 0'
                            }}
                        >
                            Let&apos;s Work Together
                        </h3>
                        <Text size="4" style={{ color: '#cbd5e1', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
                            I&apos;m always interested in new opportunities and exciting projects.
                            Whether you have a project in mind or just want to connect, feel free to reach out!
                        </Text>
                        <Flex gap="4" justify="center" wrap="wrap">
                            <Button asChild
                                size="3"
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                            >
                                <a href="mailto:amadoson3001@gmail.com">
                                    <Mail size={18} style={{ marginRight: '0.5rem' }} />
                                    Send Message
                                </a>
                            </Button>
                            <Button asChild
                                size="3"
                                variant="outline"
                                style={{
                                    borderColor: '#3b82f6',
                                    color: '#3b82f6',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                            >
                                <a href="https://github.com/Mtechsin" target="_blank" rel="noopener noreferrer">
                                    <Github size={18} style={{ marginRight: '0.5rem' }} />
                                    View Projects
                                </a>
                            </Button>
                        </Flex>
                    </Card>
                </Container>
            </main>

        </>
    )
}

export default AboutPage
