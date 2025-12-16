/** @jsxImportSource react */
'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Avatar,
  Flex,
  VStack,
  Skeleton,
  SkeletonCircle,
  Button,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FiSearch, FiSettings, FiPlus, FiServer } from 'react-icons/fi';
import { useGuilds, useSelfUserQuery } from '@/api/hooks';
import { iconUrl } from '@/api/discord';
import type { Guild } from '@/config/dashboard/types';

// Guild Card Component
function GuildCard({ guild }: { guild: Guild }) {
  const cardBg = useColorModeValue('white', 'night.800');
  const borderColor = useColorModeValue('gray.200', 'night.600');
  const hoverBorder = useColorModeValue('brand.400', 'brand.500');

  return (
    <a href={`/dash/guild/${guild.id}`}>
      <Card
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          borderColor: hoverBorder,
          transform: 'translateY(-2px)',
          shadow: 'lg',
        }}
      >
        <CardBody>
          <Flex align="center" gap={4}>
            <Avatar
              size="lg"
              name={guild.name}
              src={iconUrl(guild.id, guild.icon)}
              bg="night.600"
            />
            <Box flex="1" minW={0}>
              <Heading size="sm" noOfLines={1}>
                {guild.name}
              </Heading>
              <Flex align="center" gap={2} mt={1}>
                <Icon as={FiSettings} boxSize={3} color="gray.500" />
                <Text fontSize="xs" color="gray.500">
                  Manage Features
                </Text>
              </Flex>
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </a>
  );
}

// Loading Skeleton
function GuildSkeleton() {
  return (
    <Card>
      <CardBody>
        <Flex align="center" gap={4}>
          <SkeletonCircle size="12" />
          <VStack align="start" spacing={2} flex="1">
            <Skeleton height="20px" width="60%" />
            <Skeleton height="14px" width="40%" />
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  );
}

// Empty State
function EmptyState() {
  const cardBg = useColorModeValue('white', 'night.800');

  return (
    <Card bg={cardBg} borderRadius="xl" p={8}>
      <CardBody textAlign="center">
        <Flex justify="center" mb={4}>
          <Box
            p={4}
            borderRadius="full"
            bg={useColorModeValue('brand.50', 'whiteAlpha.100')}
          >
            <Icon as={FiServer} boxSize={8} color="brand.500" />
          </Box>
        </Flex>
        <Heading size="md" mb={2}>
          No servers found
        </Heading>
        <Text color="gray.500" mb={6} maxW="md" mx="auto">
          You don't have any servers where you can manage Amina. Make sure you
          have the "Manage Server" permission.
        </Text>
        <Button
          as="a"
          href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
          colorScheme="brand"
          leftIcon={<FiPlus />}
        >
          Invite Amina to Your Server
        </Button>
      </CardBody>
    </Card>
  );
}

// Main Dashboard Content
export function DashboardHome() {
  const [filter, setFilter] = useState('');
  const { data: user, isLoading: userLoading } = useSelfUserQuery();
  const { data: guilds, isLoading: guildsLoading, error } = useGuilds();

  const filteredGuilds = guilds?.filter((guild) =>
    guild.name.toLowerCase().includes(filter.toLowerCase())
  );

  const headingColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Container maxW="7xl" py={8}>
      {/* Header */}
      <Box mb={8}>
        <Heading size="xl" color={headingColor} mb={2}>
          Your Servers
        </Heading>
        <Text color={descColor}>
          Select a server to manage Amina's features and settings
        </Text>
      </Box>

      {/* Search */}
      <Box mb={6}>
        <InputGroup maxW="md">
          <InputLeftElement>
            <Icon as={FiSearch} color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Search servers..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </InputGroup>
      </Box>

      {/* Error State */}
      {error && (
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          <AlertDescription>
            Failed to load servers. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {guildsLoading && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GuildSkeleton key={i} />
          ))}
        </SimpleGrid>
      )}

      {/* Guilds Grid */}
      {!guildsLoading && filteredGuilds && filteredGuilds.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredGuilds.map((guild) => (
            <GuildCard key={guild.id} guild={guild} />
          ))}
        </SimpleGrid>
      )}

      {/* Empty State */}
      {!guildsLoading && filteredGuilds && filteredGuilds.length === 0 && !filter && (
        <EmptyState />
      )}

      {/* No Results */}
      {!guildsLoading && filteredGuilds && filteredGuilds.length === 0 && filter && (
        <Text color="gray.500" textAlign="center" py={8}>
          No servers found matching "{filter}"
        </Text>
      )}
    </Container>
  );
}

export default DashboardHome;
