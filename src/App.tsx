import { useEffect, useState } from "react";
import {
  createIcon,
  Box,
  Container,
  Text,
  Stack,
  IconButton,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  Input,
  FormLabel,
  Spinner,
  Image,
  FormHelperText,
} from "@chakra-ui/react";
import Player from "./ui/Player";
import parse from "./lib/parser";
import Nav from "./ui/Nav";
import { SettingsIcon } from "@chakra-ui/icons";

const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
const STORAGE_KEY = "tracks";

declare global {
  interface Window {
    google: any;
  }
}

const DEFAULT_CONFIG = {
  minViews: 100,
  minLikes: 5,
  daysAgo: 8,
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    setTimeout(() => {
      /* Initialize Google Identity Services */
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_CLIENT_ID,
        callback: handleCredentialResponse,
      });

    }, 500)

    /* Load previous tracks from localStorage */
    if (localStorage.getItem(STORAGE_KEY)) {
      setTracks(JSON.parse(localStorage.getItem(STORAGE_KEY) || ""));
    }
  }, []);

  function handleCredentialResponse(response: any) {
    const userObject = parseJwt(response.credential);
    setUser(userObject);
    setIsSignedIn(true);
  }

  function parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  function handleAuthClick() {
    if (isSignedIn) {
      // Sign out
      setUser(null);
      setIsSignedIn(false);
    } else {
      // Sign in
      window.google.accounts.id.prompt();
    }
  }

  return (
    <>
      <header>
        <Nav
          isSignedIn={isSignedIn}
          imageUrl={isSignedIn && user ? user.picture : null}
          onSignin={handleAuthClick}
          onSignout={handleAuthClick}
        />
      </header>
      <main>
        <Container marginTop={8} minHeight={96}>
          <Flex alignItems="center" justifyContent="center">
            <Button
              onClick={() => {
                setIsLoading(true);
                parse((tracks: any) => {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
                  setTracks(tracks);
                  setIsLoading(false);
                }, config);
              }}
              disabled={!user}
              colorScheme="blue"
            >
              {!isLoading ? "Start parser" : "Cancel"}
            </Button>

            <IconButton
              aria-label="Open settings"
              icon={<SettingsIcon />}
              variant="ghost"
              size="lg"
              onClick={onOpen}
            />
          </Flex>

          <Box position="fixed" top={16} left={0} width={250}>
            <Player videoId={videoId} />
          </Box>

          {isLoading ? (
            <Box textAlign="center" marginTop={4}>
              <Spinner />
            </Box>
          ) : (
            <Stack spacing={4} marginTop={4}>
              {tracks.map((t: any) => (
                <Feature
                  key={t.id}
                  title={t.snippet.title}
                  channelTitle={t.snippet.channelTitle}
                  thumnailUrl={t.snippet.thumbnails.default.url}
                  isPlaying={t.id === videoId}
                  onPlay={() => setVideoId(t.id)}
                />
              ))}
            </Stack>
          )}
        </Container>
      </main>

      <footer>
        <Box mt={6} p={4} bgColor="gray.800" color="white" textAlign="center">
          Made with Youtube Data API and Chakra UI
        </Box>
      </footer>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Parser Config</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel htmlFor="minViews">Min views</FormLabel>
              <Input
                placeholder="Min views"
                id="minViews"
                value={config.minViews}
                onChange={(e) => {
                  if (isNaN(Number(e.target.value))) {
                    return;
                  }

                  setConfig({ ...config, minViews: Number(e.target.value) });
                }}
              />
              <FormHelperText>Keep videos with at least {config.minViews} views</FormHelperText>
            </FormControl>

            <FormControl marginTop={4}>
              <FormLabel htmlFor="minLikes">Min likes</FormLabel>
              <Input
                placeholder="Min likes"
                value={config.minLikes}
                id="minLikes"
                onChange={(e) => {
                  if (isNaN(Number(e.target.value))) {
                    return;
                  }

                  setConfig({ ...config, minLikes: Number(e.target.value) });
                }}
              />
              <FormHelperText>Keep videos with at least {config.minLikes} likes</FormHelperText>
            </FormControl>

            <FormControl marginTop={4}>
              <FormLabel htmlFor="daysAgo">Days ago</FormLabel>
              <Input
                placeholder="Days ago"
                value={config.daysAgo}
                onChange={(e) => {
                  if (isNaN(Number(e.target.value))) {
                    return;
                  }

                  setConfig({ ...config, daysAgo: Number(e.target.value) });
                }}
              />
              <FormHelperText>Keep recent videos starting {config.daysAgo}</FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => setConfig(DEFAULT_CONFIG)}
            >
              Reset
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}


interface FeatureProps {
  title: string;
  thumnailUrl: string;
  channelTitle: string;
  isPlaying: boolean;
  onPlay(): void;
}

function Feature({
  title,
  thumnailUrl,
  channelTitle,
  isPlaying,
  onPlay,
  ...rest
}: FeatureProps) {
  return (
    <Box shadow="md" borderWidth="1px" {...rest}>
      <Flex alignItems="center">
        <Image src={thumnailUrl} width={74} />

        <Box ml={2}>
          <Flex>
            <Box mt={0.5}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</Box>

            <Box ml={2}>
              <Text
                fontSize="lg"
                onClick={onPlay}
                cursor="pointer"
                _hover={{ color: "teal" }}
              >
                {title}
              </Text>
              <Text fontSize="sm" color="gray">
                By {channelTitle}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

export const PlayIcon = createIcon({
  displayName: "PlayIcon",
  viewBox: "0 0 16 16",
  // path can also be an array of elements, if you have multiple paths, lines, shapes, etc.
  path: (
    <path
      fill="currentColor"
      d="M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5zM6 4.5l6 3.5-6 3.5z"
    />
  ),
});

export const PauseIcon = createIcon({
  displayName: "PauseIcon",
  viewBox: "0 0 16 16",
  // path can also be an array of elements, if you have multiple paths, lines, shapes, etc.
  path: (
    <path
      fill="currentColor"
      d="M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5zM5 5h2v6h-2zM9 5h2v6h-2z"
    />
  ),
});

export default App;
