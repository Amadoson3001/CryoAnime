'use client'

import React from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import {
    Container,
    Flex,
    Box,
    Text,
    Card,
    Heading,
    Separator
} from '@radix-ui/themes'
import {
    Shield,
    Lock,
    Eye,
    Database,
    Cookie,
    ExternalLink
} from 'lucide-react'

const PrivacyPage = () => {
    const currentYear = new Date().getFullYear()

    return (
        <>
            <Header />
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
                    <Container size="4" px="4">
                        <Flex direction="column" align="center" gap="4" style={{ textAlign: 'center' }}>
                            <Shield size={64} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                            <Heading size="8" style={{ color: 'white', marginBottom: '1rem' }}>
                                Privacy Policy
                            </Heading>
                            <Text size="5" style={{ color: '#cbd5e1', maxWidth: '600px' }}>
                                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
                            </Text>
                            <Text size="3" style={{ color: '#94a3b8' }}>
                                Last updated: {currentYear}
                            </Text>
                        </Flex>
                    </Container>
                </Box>

                {/* Content Section */}
                <Container size="4" px="4" py="8">
                    <Flex direction="column" gap="8">
                        {/* Introduction */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Flex align="center" gap="3" mb="4">
                                <Eye size={24} style={{ color: '#3b82f6' }} />
                                <Heading size="6" style={{ color: 'white' }}>Introduction</Heading>
                            </Flex>
                            <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                Welcome to CryoAnime. We are committed to protecting your privacy and being transparent about our data practices.
                                This privacy policy explains what information we collect and how we use it.
                            </Text>
                        </Card>

                        {/* Data Collection */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Flex align="center" gap="3" mb="4">
                                <Database size={24} style={{ color: '#3b82f6' }} />
                                <Heading size="6" style={{ color: 'white' }}>What Information We Collect</Heading>
                            </Flex>
                            <Flex direction="column" gap="4">
                                <Box>
                                    <Heading size="5" style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>
                                        We DO NOT Collect:
                                    </Heading>
                                    <ul style={{ color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
                                        <li>Personal information (name, email, address, phone number)</li>
                                        <li>Account registration data</li>
                                        <li>Payment information</li>
                                        <li>Location data</li>
                                        <li>Device fingerprints or tracking data</li>
                                        <li>Analytics or usage tracking</li>
                                        <li>Third-party advertising data</li>
                                    </ul>
                                </Box>
                                <Separator size="4" style={{ backgroundColor: '#334155' }} />
                                <Box>
                                    <Heading size="5" style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>
                                        We Only Store Locally:
                                    </Heading>
                                    <ul style={{ color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
                                        <li><strong>NSFW Content Preference:</strong> Your choice to view or hide NSFW content, stored locally in your browser</li>
                                        <li><strong>Cache Data:</strong> Anime information temporarily cached for better performance</li>
                                    </ul>
                                </Box>
                            </Flex>
                        </Card>

                        {/* Cookies */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Flex align="center" gap="3" mb="4">
                                <Cookie size={24} style={{ color: '#3b82f6' }} />
                                <Heading size="6" style={{ color: 'white' }}>Cookies and Local Storage</Heading>
                            </Flex>
                            <Flex direction="column" gap="4">
                                <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                    We use minimal cookies and local storage for functionality purposes only:
                                </Text>
                                <Box style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <Text size="3" weight="bold" style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>
                                        NSFW Preference Cookie
                                    </Text>
                                    <Text size="3" style={{ color: '#cbd5e1' }}>
                                        <strong>Purpose:</strong> Remembers your NSFW content display preference<br />
                                        <strong>Storage:</strong> Browser cookie and localStorage<br />
                                        <strong>Expiry:</strong> 30 days (automatically expires)<br />
                                        <strong>Usage:</strong> Filters anime content based on your preference
                                    </Text>
                                </Box>
                                <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                    You can clear these cookies at any time through your browser settings, which will simply reset your NSFW preference.
                                </Text>
                            </Flex>
                        </Card>

                        {/* Third Party Services */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Flex align="center" gap="3" mb="4">
                                <ExternalLink size={24} style={{ color: '#3b82f6' }} />
                                <Heading size="6" style={{ color: 'white' }}>Third-Party Services</Heading>
                            </Flex>
                            <Flex direction="column" gap="4">
                                <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                    CryoAnime uses the following third-party service:
                                </Text>
                                <Box style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <Flex align="center" gap="2" mb="2">
                                        <Text size="4" weight="bold" style={{ color: '#60a5fa' }}>
                                            Jikan API (MyAnimeList API)
                                        </Text>
                                        <a
                                            href="https://jikan.moe/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </Flex>
                                    <Text size="3" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                        We fetch anime data from Jikan API, which is a free, open-source API for MyAnimeList data.
                                        The API may collect anonymous usage statistics, but we don&apos;t receive or store any of this data.
                                        Your searches and browsing activity are not tracked or shared.
                                    </Text>
                                </Box>
                            </Flex>
                        </Card>

                        {/* Data Security */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Flex align="center" gap="3" mb="4">
                                <Lock size={24} style={{ color: '#3b82f6' }} />
                                <Heading size="6" style={{ color: 'white' }}>Data Security</Heading>
                            </Flex>
                            <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                Since we don&apos;t collect personal data, there are no user accounts to secure or personal information to protect.
                                Any data stored locally on your device (NSFW preferences) remains under your control and can be cleared anytime.
                            </Text>
                        </Card>

                        {/* Contact */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Heading size="6" style={{ color: 'white', marginBottom: '1rem' }}>
                                Contact Us
                            </Heading>
                            <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                If you have any questions about this privacy policy or our data practices, you can contact us through:
                            </Text>
                            <ul style={{ color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                                <li>Our <a href="/about" style={{ color: '#3b82f6', textDecoration: 'none' }}>About page</a></li>
                                <li>GitHub repository issues</li>
                                <li>Email: [Contact information available on About page]</li>
                            </ul>
                        </Card>

                        {/* Updates */}
                        <Card style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem' }}>
                            <Heading size="6" style={{ color: 'white', marginBottom: '1rem' }}>
                                Policy Updates
                            </Heading>
                            <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                This privacy policy may be updated occasionally. Any changes will be reflected on this page
                                with an updated revision date. Since we don&apos;t collect personal data, changes to this policy
                                will typically be minimal and related to service updates or clarifications.
                            </Text>
                        </Card>
                    </Flex>
                </Container>
            </main>
            <Footer />

            {/* Custom animations */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    )
}

export default PrivacyPage