import * as THREE from "three";
import {
  OrbitControls,
  useAnimations,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Dog = () => {
  const { gl } = useThree();

  const baseTextures = useTexture(
    {
      normalMap: "/dog_normals.jpg",
    },
    (textures) => {
      Object.entries(textures).forEach(([key, tex]) => {
        tex.flipY = false;
        if (!key.toLowerCase().includes("normal")) {
          tex.colorSpace = THREE.SRGBColorSpace;
        }
      });
    },
  );

  const branchTextures = useTexture(
    {
      branches_normal: "/branches_normals.jpeg",
      branches_diffuse: "/branches_diffuse.jpeg",
    },
    (textures) => {
      Object.entries(textures).forEach(([key, tex]) => {
        tex.flipY = true;
        if (!key.toLowerCase().includes("normal")) {
          tex.colorSpace = THREE.SRGBColorSpace;
        }
      });
    },
  );

  const matcapTextures = useTexture([
    "/matcap/mat-1.png",
    "/matcap/mat-2.png",
    "/matcap/mat-3.png",
    "/matcap/mat-4.png",
    "/matcap/mat-5.png",
    "/matcap/mat-6.png",
    "/matcap/mat-7.png",
    "/matcap/mat-8.png",
    "/matcap/mat-9.png",
    "/matcap/mat-10.png",
    "/matcap/mat-11.png",
    "/matcap/mat-12.png",
    "/matcap/mat-13.png",
    "/matcap/mat-14.png",
    "/matcap/mat-15.png",
    "/matcap/mat-16.png",
    "/matcap/mat-17.png",
    "/matcap/mat-18.png",
    "/matcap/mat-19.png",
    "/matcap/mat-20.png",
  ]).map((tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });

  const model = useGLTF("/models/dog.drc.glb");
  const { actions } = useAnimations(model.animations, model.scene);

  const [
    mat1,
    mat2,
    mat3,
    mat4,
    mat5,
    mat6,
    mat7,
    mat8,
    mat9,
    mat10,
    mat11,
    mat12,
    mat13,
    mat14,
    mat15,
    mat16,
    mat17,
    mat18,
    mat19,
    mat20,
  ] = matcapTextures;

  const dogModel = useRef(model);

  // ✅ Store uniform refs so GSAP can mutate them after compile
  const shaderUniforms = useRef(null);
  const material = useRef({
    uMatcap1: { value: mat19 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 1.0 },
  });

  useLayoutEffect(() => {
    if (actions["Take 001"]) {
      actions["Take 001"].reset().fadeIn(0.5).play();
    }

    function onBeforeCompile(shader) {
      // ✅ Set up uniforms with initial values
      shader.uniforms.uMatcapTexture1 = { value: mat19 }; // target matcap (hover destination)
      shader.uniforms.uMatcapTexture2 = { value: mat2 }; // base matcap
      shader.uniforms.uProgress = { value: 1.0 }; // 0 = mat2, 1 = mat19

      // ✅ Store reference so GSAP can animate it later
      shaderUniforms.current = shader.uniforms;

      // Inject custom uniforms into fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
        uniform sampler2D uMatcapTexture1;
        uniform sampler2D uMatcapTexture2;
        uniform float uProgress;
        void main() {
        `,
      );

      // ✅ Fix: match the EXACT string Three.js uses in MeshMatcapMaterial shader
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 matcapColor = texture2D( matcap, uv );",
        `
        vec4 matcapColor1 = texture2D(uMatcapTexture1, uv);
        vec4 matcapColor2 = texture2D(uMatcapTexture2, uv);
        
        float transitionfactor = 0.2;
        // Wipe transition based on view-space position
        float progress = smoothstep(
          uProgress - transitionfactor,
          uProgress,
          (vViewPosition.x + vViewPosition.y) * 0.5 + 0.5
        );

        vec4 matcapColor = mix(matcapColor2, matcapColor1, progress);
        `,
      );
    }

    const dogMaterial = new THREE.MeshMatcapMaterial({
      matcap: mat2,
      normalMap: baseTextures.normalMap,
    });
    dogMaterial.onBeforeCompile = onBeforeCompile;

    const branchesMaterial = new THREE.MeshMatcapMaterial({
      map: branchTextures.branches_diffuse,
      normalMap: branchTextures.branches_normal,
    });

    dogMaterial.onBeforeCompile = onBeforeCompile; // Set before material creation to ensure shader is compiled with our modifications

    model.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.includes("DOG")) {
          if (child.material) child.material.dispose();
          child.material = dogMaterial;
        } else {
          if (child.material) child.material.dispose();
          child.material = branchesMaterial;
        }
      }
    });
  }, [model, baseTextures, branchTextures, mat2, mat19, actions]);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#start",
        endTrigger: "#section-3",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
     
      },
    });

    tl.to(dogModel.current.scene.position, {
      z: "-=0.75",
      y: "+=0.1",
    })
      .to(dogModel.current.scene.rotation, {
        x: `+=${Math.PI / 15}`,
      })
      .to(
        dogModel.current.scene.rotation,
        {
          y: `-=${Math.PI}`,
        },
        "third",
      )
      .to(
        dogModel.current.scene.position,
        {
          x: "-=0.5",
          z: "+=0.6",
          y: "-=0.1",
        },
        "third",
      );
  }, []);

  useEffect(() => {
    const el = document.querySelector(`.title[img-title="tomorrowland"]`);
    if (!el) return;

    const handleEnter = () => {
      if (!shaderUniforms.current) return;

      shaderUniforms.current.uMatcapTexture1.value = mat19;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };

    const el2 = document.querySelector(`.title[img-title="navy-pier"]`);
    if (!el2) return;

    const handleEnter2 = () => {
      if (!shaderUniforms.current) return;
      shaderUniforms.current.uMatcapTexture1.value = mat8;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };

    const el3 = document.querySelector(`.title[img-title="msi-chicago"]`);
    if (!el3) return;

    const handleEnter3 = () => {
      if (!shaderUniforms.current) return;
      shaderUniforms.current.uMatcapTexture1.value = mat9;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };
    const el4 = document.querySelector(`.title[img-title="phone"]`);
    if (!el4) return;

    const handleEnter4 = () => {
      if (!shaderUniforms.current) return;
      shaderUniforms.current.uMatcapTexture1.value = mat12;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };
    const el5 = document.querySelector(`.title[img-title="kikk"]`);
    if (!el5) return;

    const handleEnter5 = () => {
      if (!shaderUniforms.current) return;
      shaderUniforms.current.uMatcapTexture1.value = mat10;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };
    const el6 = document.querySelector(`.title[img-title="kennedy"]`);
    if (!el6) return;

    const handleEnter6 = () => {
      if (!shaderUniforms.current) return;
      shaderUniforms.current.uMatcapTexture1.value = mat8;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };
    const el7 = document.querySelector(`.title[img-title="opera"]`);
    if (!el7) return;

    const handleEnter7 = () => {
      if (!shaderUniforms.current) return;
      shaderUniforms.current.uMatcapTexture1.value = mat13;

      gsap.to(shaderUniforms.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          shaderUniforms.current.uMatcapTexture2.value =
            shaderUniforms.current.uMatcapTexture1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };

    const titlesElement = document.querySelector(`.titles`);

    const handleMouseLeave = () => {
      shaderUniforms.current.uMatcap1.value = mat2;
      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.3,
        onComplete: () => {
          shaderUniforms.current.uMatcap2.value =
            shaderUniforms.current.uMatcap1.value;
          shaderUniforms.current.uProgress.value = 1.0;
        },
      });
    };

    titlesElement.addEventListener("mouseleave", handleMouseLeave);

    const handleScroll = () => {
      const titlesElement = document.querySelector(`.titles`);
      if (!titlesElement) return;

      const rect = titlesElement.getBoundingClientRect();
      // If titles are out of view, reset to mat2
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        if (!shaderUniforms.current) return;
        shaderUniforms.current.uMatcapTexture1.value = mat2;
        gsap.to(shaderUniforms.current.uProgress, {
          value: 0.0,
          duration: 0.3,
          onComplete: () => {
            shaderUniforms.current.uMatcapTexture2.value =
              shaderUniforms.current.uMatcapTexture1.value;
            shaderUniforms.current.uProgress.value = 1.0;
          },
        });
      }
    };

    window.addEventListener("scroll", handleScroll);

    el7.addEventListener("mouseenter", handleEnter7);

    el6.addEventListener("mouseenter", handleEnter6);

    el5.addEventListener("mouseenter", handleEnter5);

    el4.addEventListener("mouseenter", handleEnter4);

    el3.addEventListener("mouseenter", handleEnter3);

    el2.addEventListener("mouseenter", handleEnter2);

    el.addEventListener("mouseenter", handleEnter);

    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el2.removeEventListener("mouseenter", handleEnter2);
      el3.removeEventListener("mouseenter", handleEnter3);
      el4.removeEventListener("mouseenter", handleEnter4);
      el5.removeEventListener("mouseenter", handleEnter5);
      el6.removeEventListener("mouseenter", handleEnter6);
      el7.removeEventListener("mouseenter", handleEnter7);
      titlesElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mat19, mat8, mat9, mat12, mat10, mat13, mat2]);

  return (
    <>
      <primitive
        object={model.scene}
        rotation={[0, Math.PI / 4, 0]}
        position={[0.2, -0.5, 0]}
      />
      <OrbitControls enabled={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={3} />
    </>
  );
};

export default Dog;
